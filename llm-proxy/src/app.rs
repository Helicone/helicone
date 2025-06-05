use std::{
    convert::Infallible,
    future::{Ready, ready},
    net::SocketAddr,
    sync::Arc,
    task::{Context, Poll},
    time::Duration,
};

use axum_server::{accept::NoDelayAcceptor, tls_rustls::RustlsConfig};
use futures::{StreamExt, future::BoxFuture};
use meltdown::Token;
use opentelemetry::global;
use reqwest::Client;
use rustc_hash::FxHashMap as HashMap;
use telemetry::{make_span::SpanFactory, tracing::MakeRequestId};
use tokio::sync::OnceCell;
use tokio::sync::RwLock;
use tokio_tungstenite::tungstenite::Message;
use tower::{ServiceBuilder, buffer::BufferLayer, util::BoxCloneService};
use tower_http::{
    ServiceBuilderExt, add_extension::AddExtension,
    auth::AsyncRequireAuthorizationLayer, catch_panic::CatchPanicLayer,
    normalize_path::NormalizePathLayer,
    sensitive_headers::SetSensitiveHeadersLayer, trace::TraceLayer,
};
use tracing::{Level, info};
use url::Url;

use crate::{
    config::{
        Config,
        minio::Minio,
        rate_limit::{RateLimitConfig, RateLimitStore},
        server::TlsConfig,
    },
    control_plane::websocket::WebSocketClient,
    discover::monitor::health::{
        EndpointMetricsRegistry, provider::HealthMonitorMap,
    },
    error::{self, init::InitError, runtime::RuntimeError},
    metrics::{self, Metrics, attribute_extractor::AttributeExtractor},
    middleware::{
        auth::AuthService, rate_limit::service::Layer as RateLimitLayer,
    },
    router::meta::MetaRouter,
    types::{provider::ProviderKeys, router::RouterId},
    utils::{catch_panic::PanicResponder, handle_error::ErrorHandlerLayer},
};

const BUFFER_SIZE: usize = 1024;
const JAWN_CONNECT_TIMEOUT: Duration = Duration::from_secs(10);
const SERVICE_NAME: &str = "helicone-router";

pub type AppResponseBody = tower_http::body::UnsyncBoxBody<
    bytes::Bytes,
    Box<
        (
            dyn std::error::Error
                + std::marker::Send
                + std::marker::Sync
                + 'static
        ),
    >,
>;
pub type AppResponse = http::Response<AppResponseBody>;

pub type BoxedServiceStack =
    BoxCloneService<crate::types::request::Request, AppResponse, Infallible>;

pub type BoxedHyperServiceStack = BoxCloneService<
    http::Request<hyper::body::Incoming>,
    AppResponse,
    Infallible,
>;

#[derive(Debug)]
pub struct JawnClient {
    pub request_client: Client,
    pub control_plane_client: OnceCell<WebSocketClient>,
    pub base_url: Url,
}

impl JawnClient {
    #[must_use]
    pub fn new(request_client: Client, base_url: Url) -> Self {
        Self {
            request_client,
            control_plane_client: OnceCell::new(),
            base_url,
        }
    }
    async fn get_client(
        &self,
    ) -> Result<&WebSocketClient, Box<dyn std::error::Error + Send + Sync>>
    {
        // Convert HTTP URL to WebSocket URL
        let mut ws_url = self.base_url.clone();
        ws_url
            .set_scheme(match ws_url.scheme() {
                "https" => "wss",
                _ => "ws",
            })
            .map_err(|()| "Invalid URL scheme")?;

        self.control_plane_client
            .get_or_try_init(|| WebSocketClient::connect(ws_url.as_str()))
            .await
    }

    pub async fn send_message(
        &self,
        message: Message,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.get_client().await?.send_message(message)?;
        Ok(())
    }
}

#[derive(Debug)]
pub struct InnerAppState {
    pub config: Config,
    pub minio: Minio,
    pub jawn_client: JawnClient,
    pub redis: Option<r2d2::Pool<redis::Client>>,
    pub provider_keys: RwLock<HashMap<RouterId, ProviderKeys>>,
    /// Top level metrics which are exported to OpenTelemetry.
    pub metrics: Metrics,
    /// Metrics to track provider health and rate limits.
    pub endpoint_metrics: EndpointMetricsRegistry,
    pub health_monitor: HealthMonitorMap,
}

#[derive(Debug, Clone)]
pub struct AppState(pub Arc<InnerAppState>);

/// The top level app used to start the hyper server.
/// The middleware stack is as follows:
/// -- global --
/// 0. `CatchPanic`
/// 1. `HandleError`
/// 2. Authn/Authz
/// 3. Unauthenticated and authenticated rate limit layers
/// 4. `MetaRouter`
///
/// -- Router specific MW, must not require Clone on inner Service --
/// 5. Per User Rate Limit layer
/// 6. Per Org Rate Limit layer
/// 7. `RequestContext`
///    - Fetch dynamic request specific metadata
///    - Deserialize request body based on default provider
///    - Parse Helicone inputs
/// 8. Per model rate limit layer
///    - Based on request context, rate limit based on deserialized model target
///      from request context
/// 9. Request/Response cache
/// 10. Spend controls
/// 11. A/B testing between models and prompt versions
/// 12. Fallbacks
/// 13. `ProviderBalancer`
///
/// -- provider specific middleware --
/// 14. Per provider rate limit layer
/// 15. Mapper
///     - based on selected provider, map request body
/// 16. `ProviderRegionBalancer`
///
/// -- region specific middleware (none yet, just leaf service) --
/// 17. Dispatcher
///
/// For request processing, we need to use some dynamically added
/// request extensions. We try to aggregate most of this into the
/// `RequestContext` struct to keep things simple but for some things
/// we will use separate types to avoid needing to use `Option`s in
/// the `RequestContext` struct.
///
/// Required request extensions:
/// - `AuthContext`
///    - Added by the auth layer
///    - Removed by the request context layer and aggregated into the
///      `Arc<RequestContext>`
/// - `PathAndQuery`
///   - Added by the `MetaRouter`
///   - Used by the Mapper layer
/// - `ApiEndpoint`
///   - Added by the `Router`
///   - Used by the Mapper layer
/// - `Arc<RequestContext>`
///   - Added by the request context layer
///   - Used by many layers
/// - `RouterConfig`
///   - Added by the request context layer
///   - Used by the Mapper layer
/// - `MapperContext`
///   - Added by the `Mapper` layer
///   - Used by the Dispatcher layer
/// - `Provider`
///   - Added by the `AddExtensionLayer` in the dispatcher service stack
///   - Value is driven by the `Key` type used by the `Discovery` impl.
///   - Used by the Mapper layer
///
/// Required response extensions:
/// - Copied by the dispatcher from req to resp extensions
///   - `InferenceProvider`
///   - `Model`
///   - `RouterId`
///   - `PathAndQuery`
///   - `ApiEndpoint`
///   - `MapperContext`
///   - `AuthContext`
#[derive(Clone)]
pub struct App {
    pub state: AppState,
    pub service_stack: BoxedServiceStack,
}

impl tower::Service<crate::types::request::Request> for App {
    type Response = AppResponse;
    type Error = Infallible;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    #[inline]
    #[tracing::instrument(skip_all)]
    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service_stack.poll_ready(ctx)
    }

    #[inline]
    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        tracing::trace!(uri = %req.uri(), method = %req.method(), version = ?req.version(), "App received request");
        self.service_stack.call(req)
    }
}

impl App {
    pub async fn new(config: Config) -> Result<Self, InitError> {
        tracing::info!(config = ?config, "creating app");
        let minio = Minio::new(config.minio.clone())?;
        let request_client = Client::builder()
            .tcp_nodelay(true)
            .connect_timeout(JAWN_CONNECT_TIMEOUT)
            .build()
            .map_err(error::init::InitError::CreateReqwestClient)?;

        let jawn_client =
            JawnClient::new(request_client, config.helicone.base_url.clone());

        // If global meter is not set, opentelemetry defaults to a
        // NoopMeterProvider
        let meter = global::meter(SERVICE_NAME);
        let metrics = metrics::Metrics::new(&meter);
        let endpoint_metrics = EndpointMetricsRegistry::default();
        let health_monitor = HealthMonitorMap::default();

        let redis = match &config.rate_limit {
            RateLimitConfig::Global { store, .. }
            | RateLimitConfig::OptIn { store, .. }
            | RateLimitConfig::RouterSpecific { store, .. } => match store {
                RateLimitStore::Redis(redis) => {
                    let client = redis::Client::open(redis.url.0.clone())?;
                    let pool = r2d2::Pool::builder()
                        .connection_timeout(redis.connection_timeout)
                        .build(client)?;
                    Some(pool)
                }
                RateLimitStore::InMemory => None,
            },
            RateLimitConfig::Disabled => None,
        };

        let app_state = AppState(Arc::new(InnerAppState {
            config,
            minio,
            jawn_client,
            redis,
            provider_keys: RwLock::new(HashMap::default()),
            metrics,
            endpoint_metrics,
            health_monitor,
        }));

        let otel_metrics_layer =
            tower_otel_http_metrics::HTTPMetricsLayerBuilder::builder()
                .with_meter(meter)
                .with_response_extractor::<_, axum_core::body::Body>(
                    AttributeExtractor,
                )
                .build::<axum_core::body::Body, axum_core::body::Body>()?;

        let router = MetaRouter::new(app_state.clone()).await?;

        // global middleware is applied here
        let service_stack = ServiceBuilder::new()
            .layer(CatchPanicLayer::custom(PanicResponder))
            .layer(SetSensitiveHeadersLayer::new(std::iter::once(
                http::header::AUTHORIZATION,
            )))
            .layer(
                TraceLayer::new_for_http()
                    .make_span_with(SpanFactory::new(
                        Level::INFO,
                        app_state.0.config.telemetry.propagate,
                    ))
                    .on_body_chunk(())
                    .on_eos(()),
            )
            .layer(otel_metrics_layer)
            .set_x_request_id(MakeRequestId)
            .propagate_x_request_id()
            .layer(NormalizePathLayer::trim_trailing_slash())
            .layer(metrics::request_count::Layer::new(app_state.clone()))
            .layer(ErrorHandlerLayer::new(app_state.clone()))
            // NOTE: not sure if there is perf impact from Auth layer coming
            // before buffer layer, but required due to Clone bound.
            .layer(AsyncRequireAuthorizationLayer::new(AuthService::new(
                app_state.clone(),
            )))
            .layer(RateLimitLayer::global(&app_state))
            .map_err(crate::error::internal::InternalError::BufferError)
            .layer(BufferLayer::new(BUFFER_SIZE))
            .layer(ErrorHandlerLayer::new(app_state.clone()))
            .service(router);

        let app = Self {
            state: app_state,
            service_stack: BoxCloneService::new(service_stack),
        };

        Ok(app)
    }
}

impl meltdown::Service for App {
    type Future = BoxFuture<'static, Result<(), RuntimeError>>;

    fn run(self, token: Token) -> Self::Future {
        Box::pin(async move {
            let app_state = self.state.clone();
            let addr = SocketAddr::from((
                app_state.0.config.server.address,
                app_state.0.config.server.port,
            ));
            info!(address = %addr, tls = %app_state.0.config.server.tls, "server starting");

            let handle = axum_server::Handle::new();
            let app_factory = AppFactory::new_hyper_app(self);
            match &app_state.0.config.server.tls {
                TlsConfig::Enabled { cert, key } => {
                    let tls_config =
                        RustlsConfig::from_pem_file(cert.clone(), key.clone())
                            .await
                            .map_err(error::init::InitError::Tls)?;

                    tokio::select! {
                        biased;
                        server_output = axum_server::bind_rustls(addr, tls_config)
                            // https://brooker.co.za/blog/2024/05/09/nagle.html
                            .acceptor(NoDelayAcceptor)
                            .handle(handle.clone())
                            .serve(app_factory) => server_output.map_err(RuntimeError::Serve)?,
                        () = token => {
                            handle.graceful_shutdown(Some(std::time::Duration::from_secs(10)));
                        }
                    };
                }
                TlsConfig::Disabled => {
                    tokio::select! {
                        biased;
                        server_output = axum_server::bind(addr)
                            .handle(handle.clone())
                            .serve(app_factory) => server_output.map_err(RuntimeError::Serve)?,
                        () = token => {
                            handle.graceful_shutdown(Some(std::time::Duration::from_secs(10)));
                        }
                    };
                }
            }
            Ok(())
        })
    }
}

#[derive(Clone)]
pub struct HyperApp {
    pub state: AppState,
    pub service_stack: BoxedHyperServiceStack,
}

impl HyperApp {
    #[must_use]
    pub fn new(app: App) -> Self {
        let state = app.state.clone();
        let service_stack = ServiceBuilder::new()
            .map_request(|req: http::Request<hyper::body::Incoming>| {
                req.map(axum_core::body::Body::new)
            })
            .service(app);
        Self {
            state,
            service_stack: BoxCloneService::new(service_stack),
        }
    }
}

impl tower::Service<http::Request<hyper::body::Incoming>> for HyperApp {
    type Response = AppResponse;
    type Error = Infallible;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    #[inline]
    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service_stack.poll_ready(ctx)
    }

    #[inline]
    fn call(
        &mut self,
        req: http::Request<hyper::body::Incoming>,
    ) -> Self::Future {
        self.service_stack.call(req)
    }
}

#[derive(Clone)]
pub struct AppFactory<S> {
    pub state: AppState,
    pub inner: S,
}

impl<S> AppFactory<S> {
    pub fn new(state: AppState, inner: S) -> Self {
        Self { state, inner }
    }
}

impl AppFactory<HyperApp> {
    #[must_use]
    pub fn new_hyper_app(app: App) -> Self {
        Self {
            state: app.state.clone(),
            inner: HyperApp::new(app),
        }
    }
}

impl<S> tower::Service<SocketAddr> for AppFactory<S>
where
    S: Clone,
{
    type Response = AddExtension<S, SocketAddr>;
    type Error = Infallible;
    type Future = Ready<Result<Self::Response, Self::Error>>;

    #[inline]
    fn poll_ready(
        &mut self,
        _ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, socket: SocketAddr) -> Self::Future {
        // see: https://docs.rs/tower/latest/tower/trait.Service.html#be-careful-when-cloning-inner-services
        let mut inner = self.inner.clone();
        std::mem::swap(&mut self.inner, &mut inner);
        let svc = ServiceBuilder::new()
            .layer(tower_http::add_extension::AddExtensionLayer::new(socket))
            .service(inner);
        ready(Ok(svc))
    }
}
