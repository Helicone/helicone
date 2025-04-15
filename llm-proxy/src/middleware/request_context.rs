use std::{
    future::Future, marker::PhantomData, pin::Pin, sync::Arc, task::{Context, Poll}, time::Instant
};

use deadpool_postgres::Pool;
use http::Request;
use isocountry::CountryCode;

use crate::{
    error::{api::Error, database::DatabaseError},
    types::request::{Provider, RequestContext},
};

type BoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

#[derive(Debug)]
pub struct Service<S, ReqBody> {
    inner: S,
    pg_pool: Pool,
    _marker: PhantomData<ReqBody>,
}

/// A manual impl of Clone since the derived version will add a Clone bound on
/// the ReqBody type, which isn't needed since it's just used as a marker type.
impl<S, ReqBody> Clone for Service<S, ReqBody>
where
    S: Clone,
{
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
            pg_pool: self.pg_pool.clone(),
            _marker: PhantomData,
        }
    }
}

impl<S, ReqBody> Service<S, ReqBody>
{
    pub fn new(inner: S, pg_pool: Pool) -> Self {
        Self { inner, pg_pool, _marker: PhantomData }
    }
}

impl<S, ReqBody> tower::Service<Request<ReqBody>> for Service<S, ReqBody>
where
    S: tower::Service<Request<ReqBody>> + Clone + Send + Sync + 'static,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
    ReqBody: Send + Sync + 'static,
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

    fn call(&mut self, mut req: Request<ReqBody>) -> Self::Future {
        let mut this = self.clone();

        Box::pin(async move {
            let req_ctx = Arc::new(this.get_context(&req).await?);
            req.extensions_mut().insert(req_ctx);
            this.inner.call(req).await.map_err(Into::into)
        })
    }
}

impl<S, ReqBody> Service<S, ReqBody>
where
    S: tower::Service<Request<ReqBody>> + Clone,
    S::Future: Send + 'static,
    S::Response: Send + 'static,
    S::Error: Into<Error> + Send + Sync + 'static,
{
    async fn get_context(
        &self,
        _req: &Request<ReqBody>,
    ) -> Result<RequestContext, Error> {
        let client = self
            .pg_pool
            .get()
            .await
            .map_err(DatabaseError::Connection)?;
        let stmt = client.prepare_cached("SELECT 1 + $1").await.unwrap();

        // in a real implementation, we would fetch the router config from the
        // database
        let router_config = crate::config::router::test_router_config().await;
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
pub struct Layer<ReqBody> {
    pg_pool: Pool,
    _marker: PhantomData<ReqBody>,
}

impl<ReqBody> Layer<ReqBody> {
    pub fn new(pg_pool: Pool) -> Self {
        Self { pg_pool, _marker: PhantomData }
    }
}

impl<S, ReqBody> tower::Layer<S> for Layer<ReqBody>
{
    type Service = Service<S, ReqBody>;

    fn layer(&self, inner: S) -> Self::Service {
        Service::new(inner, self.pg_pool.clone())
    }
}
