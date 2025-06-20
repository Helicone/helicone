use std::{
    future::Future,
    pin::{Pin, pin},
    str::FromStr,
    task::{Context, Poll},
};

use bytes::Bytes;
use futures::ready;
use http::uri::PathAndQuery;
use http_body_util::{BodyExt, combinators::Collect};
use pin_project_lite::pin_project;
use tower::Service as _;

use crate::{
    app_state::AppState,
    endpoints::{ApiEndpoint, openai::OpenAI},
    error::{
        api::ApiError, init::InitError, internal::InternalError,
        invalid_req::InvalidRequestError,
    },
    router::direct::{DirectProxies, DirectProxyService},
    types::{
        model_id::ModelId, provider::InferenceProvider, request::Request,
        response::Response,
    },
};

#[derive(Debug, Clone)]
pub struct Service {
    direct_proxies: DirectProxies,
}

impl Service {
    pub fn new(app_state: &AppState) -> Result<Self, InitError> {
        let direct_proxies = DirectProxies::new(app_state)?;
        Ok(Self { direct_proxies })
    }
}

impl tower::Service<Request> for Service {
    type Response = Response;
    type Error = ApiError;
    type Future = ResponseFuture;

    #[inline]
    fn poll_ready(
        &mut self,
        _cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        // direct proxies are always ready so we can just return
        // `Poll::Ready(Ok(()))` e.g. see the poll_ready impl for the
        // `Dispatcher` service
        Poll::Ready(Ok(()))
    }

    #[tracing::instrument(name = "unified_api", skip_all)]
    fn call(&mut self, req: Request) -> Self::Future {
        let (parts, body) = req.into_parts();
        let direct_proxies = self.direct_proxies.clone();
        let collect_future = body.collect();
        ResponseFuture::new(collect_future, parts, direct_proxies)
    }
}

pin_project! {
    #[project = StateProj]
    enum State {
        CollectBody {
            #[pin]
            collect_future: Collect<axum_core::body::Body>,
            parts: Option<http::request::Parts>,
        },
        DetermineProvider {
            collected_body: Option<Bytes>,
            parts: Option<http::request::Parts>,
        },
        InitProxy {
            request: Option<Request>,
            provider: InferenceProvider,
        },
        Proxy {
            #[pin]
            response_future: <DirectProxyService as tower::Service<Request>>::Future,
        },
    }
}

pin_project! {
    pub struct ResponseFuture {
        #[pin]
        state: State,
        direct_proxies: DirectProxies,
    }
}

impl ResponseFuture {
    pub fn new(
        collect_future: Collect<axum_core::body::Body>,
        parts: http::request::Parts,
        direct_proxies: DirectProxies,
    ) -> Self {
        Self {
            state: State::CollectBody {
                collect_future,
                parts: Some(parts),
            },
            direct_proxies,
        }
    }
}

impl Future for ResponseFuture {
    type Output = Result<Response, ApiError>;

    #[allow(clippy::too_many_lines)]
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let mut this = self.project();
        loop {
            match this.state.as_mut().project() {
                StateProj::CollectBody {
                    collect_future,
                    parts,
                } => {
                    let collected = match ready!(pin!(collect_future).poll(cx))
                    {
                        Ok(collected) => collected,
                        Err(e) => {
                            return Poll::Ready(Err(
                                InternalError::CollectBodyError(e).into(),
                            ));
                        }
                    };
                    let mut parts =
                        parts.take().expect("future polled after completion");
                    let Some(extracted_path_and_query) =
                        parts.extensions.get::<PathAndQuery>()
                    else {
                        return Poll::Ready(Err(
                            InternalError::ExtensionNotFound("PathAndQuery")
                                .into(),
                        ));
                    };
                    let Some(api_endpoint) = ApiEndpoint::new(
                        extracted_path_and_query.path(),
                        InferenceProvider::OpenAI,
                    ) else {
                        return Poll::Ready(Err(
                            InvalidRequestError::UnsupportedEndpoint(
                                extracted_path_and_query.path().to_string(),
                            )
                            .into(),
                        ));
                    };
                    // since we *need* to have first class support for the
                    // OpenAI endpoint in order to
                    // deserialize it and extract the model
                    // id (in order to know the appropriate
                    // provider), we can only support OpenAI chat completions
                    // as the endpoint for now.
                    match api_endpoint {
                        ApiEndpoint::OpenAI(OpenAI::ChatCompletions(_)) => {}
                        _ => {
                            return Poll::Ready(Err(
                                InvalidRequestError::UnsupportedEndpoint(
                                    extracted_path_and_query.path().to_string(),
                                )
                                .into(),
                            ));
                        }
                    }
                    parts.extensions.insert(api_endpoint);
                    this.state.set(State::DetermineProvider {
                        collected_body: Some(collected.to_bytes()),
                        parts: Some(parts),
                    });
                }
                StateProj::DetermineProvider {
                    collected_body,
                    parts,
                } => {
                    let body = collected_body
                        .take()
                        .expect("future polled after completion");
                    let deserialized_body = serde_json::from_slice::<
                        async_openai::types::CreateChatCompletionRequest,
                    >(&body)
                    .map_err(InvalidRequestError::InvalidRequestBody)?;
                    let source_model =
                        ModelId::from_str(&deserialized_body.model)
                            .map_err(InternalError::MapperError)?;
                    let mut parts =
                        parts.take().expect("future polled after completion");
                    let provider = match source_model {
                        ModelId::OpenAI(_) => InferenceProvider::OpenAI,
                        ModelId::Anthropic(_) => InferenceProvider::Anthropic,
                        ModelId::GoogleGemini(_) => {
                            InferenceProvider::GoogleGemini
                        }
                        ModelId::Bedrock(_) => InferenceProvider::Bedrock,
                        ModelId::Ollama(_) => InferenceProvider::Ollama,
                        ModelId::Unknown(_) => {
                            return Poll::Ready(Err(
                                InvalidRequestError::UnsupportedEndpoint(
                                    format!(
                                        "provider for the given model: \
                                         '{source_model}' not supported"
                                    ),
                                )
                                .into(),
                            ));
                        }
                    };
                    parts.extensions.insert(provider);
                    let request = Request::from_parts(
                        parts,
                        axum_core::body::Body::from(body),
                    );
                    this.state.set(State::InitProxy {
                        request: Some(request),
                        provider,
                    });
                }
                StateProj::InitProxy { request, provider } => {
                    let request =
                        request.take().expect("future polled after completion");
                    let mut direct_proxy = this.direct_proxies.get(provider).ok_or_else(|| {
                        tracing::warn!(provider = %provider, "requested provider is not configured for direct proxy");
                        InvalidRequestError::UnsupportedProvider(*provider)
                    })?.clone();
                    let response_future = direct_proxy.call(request);
                    this.state.set(State::Proxy { response_future });
                }
                StateProj::Proxy { response_future } => {
                    let response =
                        ready!(response_future.poll(cx)).map_err(|_| {
                            tracing::error!(
                                "encountered error from what should be \
                                 infallible service"
                            );
                            InternalError::Internal
                        })?;
                    return Poll::Ready(Ok(response));
                }
            }
        }
    }
}
