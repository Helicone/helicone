use std::{
    future::{Ready, ready},
    str::FromStr,
    task::{Context, Poll},
};

use compact_str::CompactString;
use http::uri::PathAndQuery;
use pin_project_lite::pin_project;
use regex::Regex;
use rustc_hash::FxHashMap as HashMap;
use tower::{Service as _, ServiceBuilder};

use crate::{
    app_state::AppState,
    config::DeploymentTarget,
    error::{
        api::ApiError, init::InitError, internal::InternalError,
        invalid_req::InvalidRequestError,
    },
    middleware::{
        cache::{CacheLayer, CacheService},
        rate_limit,
    },
    router::{
        direct::{DirectProxiesWithoutMapper, DirectProxyServiceWithoutMapper},
        service::{Router, RouterFuture},
        unified_api,
    },
    types::{
        extensions::MapperContext, provider::InferenceProvider,
        router::RouterId,
    },
    utils::handle_error::{ErrorHandler, ErrorHandlerLayer},
};

/// Regex for the following URL format:
/// - `/router/{name}`
/// - `/router/{name}?{query}`
/// - `/router/{name}/{path}`
/// - `/router/{name}/{path}?{query}`
///
/// eg:
/// - `/router/default`
/// - `/router/my-router`
/// - `/router/my-router?user=bar`
/// - `/router/default/v1/chat/completions`
/// - `/router/my-router/v1/chat/completions`
/// - `/router/my-router/v1/chat/completions?user=test&limit=10`
const URL_REGEX: &str =
    r"^/router/(?P<id>[A-Za-z0-9_-]{1,12})(?P<path>/[^?]*)?(?P<query>\?.*)?$";

pub type UnifiedApiService =
    rate_limit::Service<CacheService<ErrorHandler<unified_api::Service>>>;

#[derive(Debug)]
pub struct MetaRouter {
    inner: HashMap<RouterId, Router>,
    unified_api: UnifiedApiService,
    direct_proxies: DirectProxiesWithoutMapper,
    url_regex: Regex,
}

impl MetaRouter {
    pub async fn new(app_state: AppState) -> Result<Self, InitError> {
        let meta_router = match app_state.0.config.deployment_target {
            DeploymentTarget::SelfHosted | DeploymentTarget::Sidecar => {
                Self::from_config(app_state).await
            }
            DeploymentTarget::Cloud => {
                return Err(InitError::DeploymentTargetNotSupported(
                    app_state.0.config.deployment_target.clone(),
                ));
            }
        }?;
        tracing::info!(
            num_routers = meta_router.inner.len(),
            "meta router created"
        );
        Ok(meta_router)
    }

    pub async fn from_config(app_state: AppState) -> Result<Self, InitError> {
        let url_regex =
            Regex::new(URL_REGEX).expect("always valid if tests pass");
        let mut inner = HashMap::default();
        for router_id in app_state.0.config.routers.as_ref().keys() {
            let router =
                Router::new(router_id.clone(), app_state.clone()).await?;
            inner.insert(router_id.clone(), router);
        }
        let unified_api = ServiceBuilder::new()
            // TODO: should we change how global configs work for rate limiting,
            // caching?       For now, leave these types here to
            // make it easier to change later on.
            .layer(rate_limit::Layer::disabled())
            .layer(CacheLayer::disabled())
            .layer(ErrorHandlerLayer::new(app_state.clone()))
            .service(unified_api::Service::new(&app_state)?);
        let direct_proxies = DirectProxiesWithoutMapper::new(&app_state)?;
        let meta_router = Self {
            inner,
            unified_api,
            direct_proxies,
            url_regex,
        };
        Ok(meta_router)
    }

    fn handle_router_request(
        &mut self,
        mut req: crate::types::request::Request,
    ) -> ResponseFuture {
        let Ok((router_id, extracted_api_path)) =
            extract_router_id_and_path(&self.url_regex, req.uri().path())
        else {
            return ResponseFuture::Ready {
                future: ready(Err(ApiError::InvalidRequest(
                    InvalidRequestError::NotFound(req.uri().path().to_string()),
                ))),
            };
        };
        tracing::trace!(
            router_id = %router_id,
            api_path = extracted_api_path,
            "received /router request"
        );
        let extracted_path_and_query =
            if let Some(query_params) = req.uri().query() {
                PathAndQuery::try_from(format!(
                    "{extracted_api_path}?{query_params}"
                ))
            } else {
                PathAndQuery::try_from(extracted_api_path)
            };

        let Ok(extracted_path_and_query) = extracted_path_and_query else {
            // This should **never** happen theoretically since in order to
            // get this far, the request uri should have
            // been valid, and a subpath of that which
            // we extract with the regex should also be valid.
            tracing::warn!("Failed to convert extracted path to PathAndQuery");
            return ResponseFuture::Ready {
                future: ready(Err(ApiError::Internal(InternalError::Internal))),
            };
        };
        if let Some(router) = self.inner.get_mut(&router_id) {
            req.extensions_mut().insert(extracted_path_and_query);
            ResponseFuture::RouterRequest {
                future: router.call(req),
            }
        } else {
            ResponseFuture::Ready {
                future: ready(Err(ApiError::InvalidRequest(
                    InvalidRequestError::NotFound(req.uri().path().to_string()),
                ))),
            }
        }
    }

    fn handle_unified_api_request(
        &mut self,
        mut req: crate::types::request::Request,
    ) -> ResponseFuture {
        let rest = req.uri().path().trim_start_matches("/ai");
        tracing::trace!(api_path = rest, "received /ai request");
        let extracted_path_and_query =
            if let Some(query_params) = req.uri().query() {
                PathAndQuery::try_from(format!("{rest}?{query_params}"))
            } else {
                PathAndQuery::try_from(rest)
            };
        let Ok(extracted_path_and_query) = extracted_path_and_query else {
            return ResponseFuture::Ready {
                future: ready(Err(ApiError::Internal(InternalError::Internal))),
            };
        };
        req.extensions_mut().insert(extracted_path_and_query);
        // assumes request is from OpenAI compatible client
        // and uses the model name to determine the provider.
        ResponseFuture::UnifiedApi {
            future: self.unified_api.call(req),
        }
    }

    fn handle_direct_proxy_request(
        &mut self,
        mut req: crate::types::request::Request,
    ) -> ResponseFuture {
        // Extract the first path segment (e.g. "openai" from
        // "/openai/v1/chat")
        let path = req.uri().path();
        let mut segment_iter = path.trim_start_matches('/').split('/');
        let first_segment = segment_iter.next().unwrap_or("");
        tracing::trace!(
            provider = %first_segment,
            "received /{{provider}} request"
        );
        match InferenceProvider::from_str(first_segment) {
            Ok(provider) => {
                let rest = segment_iter.collect::<Vec<_>>().join("/");
                let extracted_path_and_query =
                    if let Some(query_params) = req.uri().query() {
                        PathAndQuery::try_from(format!("{rest}?{query_params}"))
                    } else {
                        PathAndQuery::try_from(rest)
                    };
                let Ok(extracted_path_and_query) = extracted_path_and_query
                else {
                    return ResponseFuture::Ready {
                        future: ready(Err(ApiError::Internal(
                            InternalError::Internal,
                        ))),
                    };
                };
                req.extensions_mut().insert(extracted_path_and_query);
                // for the passthrough endpoints, we don't want to
                // collect/deserialize the request
                // body, and thus we must assume the request is not a stream
                // request and cannot support streaming.
                let mapper_ctx = MapperContext {
                    is_stream: false,
                    model: None,
                };
                req.extensions_mut().insert(mapper_ctx);

                let Some(mut direct_proxy) =
                    self.direct_proxies.get(&provider).cloned()
                else {
                    tracing::warn!(provider = %provider, "requested provider is not configured for direct proxy");
                    return ResponseFuture::Ready {
                        future: ready(Err(ApiError::InvalidRequest(
                            InvalidRequestError::UnsupportedProvider(provider),
                        ))),
                    };
                };
                ResponseFuture::DirectProxy {
                    future: direct_proxy.call(req),
                }
            }
            Err(e) => {
                tracing::debug!(
                    error = %e,
                    "Invalid inference provider"
                );
                ResponseFuture::Ready {
                    future: ready(Err(ApiError::InvalidRequest(
                        InvalidRequestError::NotFound(path.to_string()),
                    ))),
                }
            }
        }
    }
}

impl tower::Service<crate::types::request::Request> for MetaRouter {
    type Response = crate::types::response::Response;
    type Error = ApiError;
    type Future = ResponseFuture;

    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        let mut any_pending = false;
        for router in self.inner.values_mut() {
            if router.poll_ready(ctx).is_pending() {
                any_pending = true;
            }
        }
        if self.unified_api.poll_ready(ctx).is_pending() {
            any_pending = true;
        }
        // we don't need to poll the direct proxies since they
        // always return `Poll::Ready(Ok(()))`. However, if this
        // were to change, we would need to poll them here.
        if any_pending {
            Poll::Pending
        } else {
            Poll::Ready(Ok(()))
        }
    }

    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        if req.uri().path().starts_with("/router") {
            self.handle_router_request(req)
        } else if req.uri().path().starts_with("/ai") {
            self.handle_unified_api_request(req)
        } else {
            self.handle_direct_proxy_request(req)
        }
    }
}

fn extract_router_id_and_path<'a>(
    url_regex: &Regex,
    path: &'a str,
) -> Result<(RouterId, &'a str), ApiError> {
    // Attempt to match the incoming URI path against the provided regex
    if let Some(captures) = url_regex.captures(path) {
        // --- Determine the router id ---
        let id_str = captures
            .name("id")
            .ok_or_else(|| {
                ApiError::InvalidRequest(InvalidRequestError::NotFound(
                    path.to_string(),
                ))
            })?
            .as_str();

        // Treat the special literal "default" (case-insensitive) as the default
        // router. Anything else is considered a named router.
        let router_id = if id_str.eq_ignore_ascii_case("default") {
            RouterId::Default
        } else {
            RouterId::Named(CompactString::from(id_str))
        };

        // --- Determine the API sub-path
        // ------------------------------------------------------
        // Priority:
        //   1. If a concrete path segment was captured (e.g. "/v1/chat"), use
        //      it.
        //   2. If no path but a query string was captured (e.g. "?q=foo"),
        //      return the raw query component so the caller can attempt to
        //      reconstruct a `PathAndQuery`.
        //   3. Otherwise default to the root path "/".
        let api_path = if let Some(path_match) = captures.name("path") {
            let p = path_match.as_str();
            if p.is_empty() { "/" } else { p }
        } else if let Some(query_match) = captures.name("query") {
            query_match.as_str()
        } else {
            "/"
        };

        Ok((router_id, api_path))
    } else {
        // If the regex does not match at all, the request URI is considered
        // invalid.
        Err(ApiError::InvalidRequest(InvalidRequestError::NotFound(
            path.to_string(),
        )))
    }
}

pin_project! {
    #[project = ResponseFutureProj]
    pub enum ResponseFuture {
        Ready {
            #[pin]
            future: Ready<Result<crate::types::response::Response, ApiError>>,
        },
        RouterRequest {
            #[pin]
            future: RouterFuture,
        },
        UnifiedApi {
            #[pin]
            future: <UnifiedApiService as tower::Service<crate::types::request::Request>>::Future,
        },
        DirectProxy {
            #[pin]
            future: <DirectProxyServiceWithoutMapper as tower::Service<crate::types::request::Request>>::Future,
        },
    }
}

impl Future for ResponseFuture {
    type Output = Result<crate::types::response::Response, ApiError>;

    fn poll(
        self: std::pin::Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Self::Output> {
        match self.project() {
            ResponseFutureProj::Ready { future } => future.poll(cx),
            ResponseFutureProj::RouterRequest { future } => future.poll(cx),
            ResponseFutureProj::UnifiedApi { future } => future.poll(cx),
            ResponseFutureProj::DirectProxy { future } => future
                .poll(cx)
                .map_err(|_| ApiError::Internal(InternalError::Internal)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_regex() {
        let regex = Regex::new(URL_REGEX).expect("Regex should be valid");

        // --- Positive cases
        // ---------------------------------------------------
        // Basic default router id
        assert!(regex.is_match("/router/default"));

        // Default router id with additional API path
        assert!(regex.is_match("/router/default/v1/chat/completions"));

        // Default router id with query parameters
        assert!(regex.is_match("/router/default?user=test"));

        // Named router id containing a hyphen
        assert!(regex.is_match("/router/my-router"));

        // Named router id with additional API path and query parameters
        assert!(regex.is_match(
            "/router/my-router/v1/chat/completions?user=test&limit=10"
        ));

        // --- Negative cases
        // ---------------------------------------------------
        // Missing router id
        assert!(!regex.is_match("/router"));
        assert!(!regex.is_match("/router/"));

        // Router id exceeds 12 characters
        assert!(!regex.is_match("/router/this-id-is-way-too-long"));

        // Path does not start with /router
        assert!(!regex.is_match("/other/path"));
    }

    #[test]
    fn test_extract_router_id_and_path() {
        let url_regex = Regex::new(URL_REGEX).unwrap();

        // --- Default router id
        // -------------------------------------------------
        let path_default = "/router/default";
        let expected_api_path_default = "/";
        assert_eq!(
            extract_router_id_and_path(&url_regex, path_default).unwrap(),
            (RouterId::Default, expected_api_path_default)
        );

        // Default router id with API path and query params
        let path_default_with_path_query =
            "/router/default/v1/chat/completions?user=test";
        let expected_api_path_default_with_path_query = "/v1/chat/completions";
        assert_eq!(
            extract_router_id_and_path(
                &url_regex,
                path_default_with_path_query
            )
            .unwrap(),
            (RouterId::Default, expected_api_path_default_with_path_query)
        );

        // --- Named router id
        // ---------------------------------------------------
        let path_named = "/router/my-router";
        let expected_api_path_named = "/";
        assert_eq!(
            extract_router_id_and_path(&url_regex, path_named).unwrap(),
            (
                RouterId::Named(CompactString::from("my-router")),
                expected_api_path_named
            )
        );

        // Named router id with additional API path
        let path_named_with_path = "/router/my-router/v1/chat/completions";
        let expected_api_path_named_with_path = "/v1/chat/completions";
        assert_eq!(
            extract_router_id_and_path(&url_regex, path_named_with_path)
                .unwrap(),
            (
                RouterId::Named(CompactString::from("my-router")),
                expected_api_path_named_with_path
            )
        );

        // Named router id with query params but no explicit API path
        let path_named_query_only = "/router/my-router?foo=bar";
        let expected_api_path_named_query_only = "?foo=bar";
        assert_eq!(
            extract_router_id_and_path(&url_regex, path_named_query_only)
                .unwrap(),
            (
                RouterId::Named(CompactString::from("my-router")),
                expected_api_path_named_query_only
            )
        );

        // --- Invalid cases
        // -----------------------------------------------------
        let path_missing_id = "/router";
        assert!(matches!(
            extract_router_id_and_path(&url_regex, path_missing_id),
            Err(ApiError::InvalidRequest(_))
        ));

        let path_id_too_long = "/router/this-id-is-way-too-long";
        assert!(matches!(
            extract_router_id_and_path(&url_regex, path_id_too_long),
            Err(ApiError::InvalidRequest(_))
        ));
    }
}
