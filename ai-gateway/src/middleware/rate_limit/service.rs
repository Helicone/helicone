use std::{
    future::Future,
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
};

use governor::middleware::StateInformationMiddleware;
use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder};

use super::extractor::RateLimitKeyExtractor;
use crate::{
    app_state::AppState,
    config::{
        rate_limit::{RateLimiterConfig, default_refill_frequency},
        router::{RouterConfig, RouterRateLimitConfig},
    },
    error::init::InitError,
    types::router::RouterId,
};

pub type OptionalGovernorLayer =
    Option<GovernorLayer<RateLimitKeyExtractor, StateInformationMiddleware>>;
pub type GovernorService<S> = tower_governor::governor::Governor<
    RateLimitKeyExtractor,
    StateInformationMiddleware,
    S,
>;

#[derive(Clone)]
pub struct Layer {
    inner: OptionalGovernorLayer,
}

impl Layer {
    /// Create a new rate limit layer to be applied globally.
    #[must_use]
    pub fn global(app_state: &AppState) -> Self {
        Self::new_inner(app_state.0.global_rate_limit.clone())
    }

    #[must_use]
    fn new_inner(rl: Option<Arc<RateLimiterConfig>>) -> Self {
        if let Some(rl) = rl {
            Self {
                inner: Some(GovernorLayer { config: rl }),
            }
        } else {
            Self { inner: None }
        }
    }

    /// For when we statically know that rate limiting is disabled.
    #[must_use]
    pub fn disabled() -> Self {
        Self { inner: None }
    }

    pub async fn per_router(
        app_state: &AppState,
        router_id: RouterId,
        router_config: &RouterConfig,
    ) -> Result<Self, InitError> {
        match &router_config.rate_limit {
            RouterRateLimitConfig::None => Ok(Self { inner: None }),
            RouterRateLimitConfig::Custom { limits } => {
                let gcra = &limits.per_api_key;
                let per_cell_duration = gcra
                    .refill_frequency
                    .checked_div(gcra.capacity.into())
                    .unwrap_or_else(|| {
                        tracing::warn!(
                            "fill_frequency is too small for capacity, using \
                             default fill frequency"
                        );
                        default_refill_frequency()
                    });

                let rl = GovernorConfigBuilder::default()
                    .period(per_cell_duration)
                    .burst_size(gcra.capacity.get())
                    .use_headers()
                    .key_extractor(RateLimitKeyExtractor)
                    .finish()
                    .ok_or(InitError::InvalidRateLimitConfig(
                        "Invalid rate limit config",
                    ))?;
                let rl = Arc::new(rl);
                add_rate_limit_to_app_state(app_state, router_id, rl.clone())
                    .await;

                Ok(Self {
                    inner: Some(GovernorLayer { config: rl.clone() }),
                })
            }
        }
    }
}

async fn add_rate_limit_to_app_state(
    app_state: &AppState,
    router_id: RouterId,
    rl_config: Arc<RateLimiterConfig>,
) {
    let mut write_guard = app_state.0.router_rate_limits.write().await;
    write_guard.insert(router_id, rl_config);
}

impl<S> tower::layer::Layer<S> for Layer {
    type Service = Service<S>;

    fn layer(&self, service: S) -> Self::Service {
        match &self.inner {
            Some(inner) => Service::Enabled {
                service: inner.layer(service),
            },
            None => Service::Disabled { service },
        }
    }
}

#[derive(Debug, Clone)]
pub enum Service<S> {
    Enabled { service: GovernorService<S> },
    Disabled { service: S },
}

pin_project_lite::pin_project! {
    #[derive(Debug)]
    #[project = EnumProj]
    pub enum ResponseFuture<EnabledFuture, DisabledFuture> {
        Enabled { #[pin] future: EnabledFuture },
        Disabled { #[pin] future: DisabledFuture },
    }
}

impl<EnabledFuture, DisabledFuture, Response, Error> Future
    for ResponseFuture<EnabledFuture, DisabledFuture>
where
    EnabledFuture: Future<Output = Result<Response, Error>>,
    DisabledFuture: Future<Output = Result<Response, Error>>,
{
    type Output = Result<Response, Error>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        match self.project() {
            EnumProj::Enabled { future } => future.poll(cx),
            EnumProj::Disabled { future } => future.poll(cx),
        }
    }
}

impl<S, Request> tower::Service<Request> for Service<S>
where
    S: tower::Service<Request>,
    GovernorService<S>:
        tower::Service<Request, Response = S::Response, Error = S::Error>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = ResponseFuture<
        <GovernorService<S> as tower::Service<Request>>::Future,
        S::Future,
    >;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        match self {
            Service::Enabled { service } => service.poll_ready(cx),
            Service::Disabled { service } => service.poll_ready(cx),
        }
    }

    fn call(&mut self, request: Request) -> Self::Future {
        match self {
            Service::Enabled { service } => ResponseFuture::Enabled {
                future: service.call(request),
            },
            Service::Disabled { service } => ResponseFuture::Disabled {
                future: service.call(request),
            },
        }
    }
}

#[cfg(all(test, feature = "testing"))]
mod tests {
    use std::{num::NonZeroU32, time::Duration};

    use super::*;
    use crate::{
        app_state::AppState,
        config::{
            Config,
            rate_limit::{
                GcraConfig, GlobalRateLimitConfig, LimitsConfig, RateLimitStore,
            },
            router::{RouterConfig, RouterRateLimitConfig},
        },
        tests::TestDefault,
        types::router::RouterId,
    };

    async fn create_test_app_state(
        rate_limit_config: GlobalRateLimitConfig,
    ) -> AppState {
        let mut config = Config::test_default();
        config.global.rate_limit = Some(rate_limit_config);
        let app = crate::app::App::new(config)
            .await
            .expect("failed to create app");
        app.state
    }

    fn create_test_limits() -> LimitsConfig {
        LimitsConfig {
            per_api_key: GcraConfig {
                capacity: NonZeroU32::new(10).unwrap(),
                refill_frequency: Duration::from_secs(1),
            },
        }
    }

    fn create_router_config(rate_limit: RouterRateLimitConfig) -> RouterConfig {
        RouterConfig {
            rate_limit,
            ..Default::default()
        }
    }

    #[tokio::test]
    async fn global_app_with_none_router() {
        let app_state = create_test_app_state(GlobalRateLimitConfig {
            store: RateLimitStore::InMemory,
            limits: Some(create_test_limits()),
            cleanup_interval: Duration::from_secs(300),
        })
        .await;
        let router_config = create_router_config(RouterRateLimitConfig::None);

        let result =
            Layer::per_router(&app_state, RouterId::Default, &router_config)
                .await;
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_none());
    }

    #[tokio::test]
    async fn global_app_with_custom_router() {
        let app_state = create_test_app_state(GlobalRateLimitConfig {
            store: RateLimitStore::InMemory,
            limits: Some(create_test_limits()),
            cleanup_interval: Duration::from_secs(300),
        })
        .await;
        let router_config =
            create_router_config(RouterRateLimitConfig::Custom {
                limits: create_test_limits(),
            });

        let result =
            Layer::per_router(&app_state, RouterId::Default, &router_config)
                .await;
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_some());
    }

    #[tokio::test]
    async fn router_specific_app_with_custom_router() {
        let app_state = create_test_app_state(GlobalRateLimitConfig {
            store: RateLimitStore::InMemory,
            limits: None,
            cleanup_interval: Duration::from_secs(300),
        })
        .await;
        let router_config =
            create_router_config(RouterRateLimitConfig::Custom {
                limits: create_test_limits(),
            });

        let result =
            Layer::per_router(&app_state, RouterId::Default, &router_config)
                .await;
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_some());
    }
}
