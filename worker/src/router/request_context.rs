use std::{
    future::Future,
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
    time::Instant,
};

use http::Request;
use isocountry::CountryCode;

use crate::{
    dispatcher::ReqBody as Body,
    error::Error,
    types::request::{Provider, RequestContext},
};

type BoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

#[derive(Debug, Clone)]
pub struct Service<S> {
    inner: S,
}

impl<S> Service<S> {
    pub fn new(inner: S) -> Self {
        Self { inner }
    }
}

impl<S> tower::Service<Request<Body>> for Service<S>
where
    S: tower::Service<Request<Body>> + Clone + Send + Sync + 'static,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
{
    type Response = S::Response;
    type Error = Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx).map_err(Into::into)
    }

    fn call(&mut self, mut req: Request<Body>) -> Self::Future {
        let mut this = self.clone();
        println!("in request_context layer");

        Box::pin(async move {
            let req_ctx = Arc::new(this.get_context(&req).await?);
            req.extensions_mut().insert(req_ctx);
            this.inner.call(req).await.map_err(Into::into)
        })
    }
}

impl<S> Service<S>
where
    S: tower::Service<Request<Body>> + Clone,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
{
    async fn get_context(
        &self,
        _req: &Request<Body>,
    ) -> Result<RequestContext, Error> {
        // in a real implementation, we would fetch the router config from the
        // database
        let router_config =
            crate::types::config::router::test_router_config().await;
        // let target_url =
            // url::Url::parse("https://api.openai.com/v1/chat/completions").unwrap();
        let target_url =
            url::Url::parse("https://api.anthropic.com/v1/messages").unwrap();
        let helicone = crate::types::request::HeliconeContext {
            api_key: "test-api-key".to_string(),
            user_id: "test-user-id".to_string(),
            properties: None,
            template_inputs: None,
        };
        let proxy_context = crate::types::request::RequestProxyContext {
            target_url,
            target_provider: Provider::Anthropic,
            // target_provider: Provider::OpenAI,
            original_provider: Provider::OpenAI,
            provider_api_key: std::env::var("ANTHROPIC_API_KEY").unwrap(),
            // provider_api_key: std::env::var("OPENAI_API_KEY").unwrap(),
        };
        let req_ctx = RequestContext {
            router_config,
            proxy_context,
            helicone,
            is_stream: false,
            request_id: "test-request-id".to_string(),
            country_code: CountryCode::USA,
            start_time: Instant::now(),
        };

        Ok(req_ctx)
    }
}

#[derive(Debug, Clone)]
pub struct Layer;

impl<S> tower::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner)
    }
}
