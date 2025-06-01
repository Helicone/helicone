use std::{
    future::Future,
    pin::Pin,
    task::{Context, Poll},
};

use brakes::{
    RateLimiter, backend::redis::RedisBackend, types::token_bucket::TokenBucket,
};
use tower::util::Either;

use super::{brakes::TowerRateLimiterLayer, extractor::RateLimitKeyExtractor};
use crate::{
    app::AppState,
    config::{
        rate_limit::{LimitConfig, RateLimitConfig, RateLimitStore},
        router::{RouterConfig, RouterRateLimitConfig},
    },
    error::init::InitError,
};

pub type RedisRateLimitService<S> =
    crate::middleware::rate_limit::brakes::TowerRateLimiter<
        S,
        TokenBucket,
        RedisBackend,
        RateLimitKeyExtractor,
    >;

pub type InMemoryRateLimitService<S> =
    crate::middleware::rate_limit::brakes::TowerRateLimiter<
        S,
        TokenBucket,
        brakes::backend::local::Memory,
        RateLimitKeyExtractor,
    >;

type RedisRateLimitLayer =
    crate::middleware::rate_limit::brakes::TowerRateLimiterLayer<
        TokenBucket,
        RedisBackend,
        RateLimitKeyExtractor,
    >;

type InMemoryRateLimitLayer =
    crate::middleware::rate_limit::brakes::TowerRateLimiterLayer<
        TokenBucket,
        brakes::backend::local::Memory,
        RateLimitKeyExtractor,
    >;

#[derive(Clone)]
pub struct Layer {
    inner: Option<Either<RedisRateLimitLayer, InMemoryRateLimitLayer>>,
}

impl Layer {
    /// Create a new rate limit layer to be applied globally.
    #[must_use]
    pub fn global(app_state: &AppState) -> Self {
        match &app_state.0.config.rate_limit {
            RateLimitConfig::Global { limits, store } => Self {
                inner: Some(build_rate_limit_layer(app_state, limits, store)),
            },
            RateLimitConfig::OptIn { .. }
            | RateLimitConfig::RouterSpecific { .. }
            | RateLimitConfig::Disabled => Self { inner: None },
        }
    }

    pub fn per_router(
        app_state: &AppState,
        router_config: &RouterConfig,
    ) -> Result<Self, InitError> {
        match (&app_state.0.config.rate_limit, &router_config.rate_limit) {
            (
                RateLimitConfig::Global { store, .. }
                | RateLimitConfig::RouterSpecific { store }
                | RateLimitConfig::OptIn { store, .. },
                RouterRateLimitConfig::Custom { limits },
            )
            | (
                RateLimitConfig::OptIn { store, limits },
                RouterRateLimitConfig::OptIn,
            ) => Ok(Self {
                inner: Some(build_rate_limit_layer(app_state, limits, store)),
            }),

            (
                RateLimitConfig::Global { .. }
                | RateLimitConfig::OptIn { .. }
                | RateLimitConfig::RouterSpecific { .. }
                | RateLimitConfig::Disabled,
                RouterRateLimitConfig::None,
            ) => Ok(Self { inner: None }),
            (
                RateLimitConfig::Disabled,
                RouterRateLimitConfig::Custom { .. }
                | RouterRateLimitConfig::OptIn,
            ) => Err(InitError::InvalidRateLimitConfig(
                "Rate limiting is disabled at the app level",
            )),
            (
                RateLimitConfig::RouterSpecific { .. }
                | RateLimitConfig::Global { .. },
                RouterRateLimitConfig::OptIn,
            ) => Err(InitError::InvalidRateLimitConfig(
                "App-level rate limiting does not allow rate limiting opt-in",
            )),
        }
    }
}

fn build_rate_limit_layer(
    app_state: &AppState,
    limits: &LimitConfig,
    store: &RateLimitStore,
) -> Either<RedisRateLimitLayer, InMemoryRateLimitLayer> {
    let strategy = TokenBucket::new(
        limits.per_user.capacity,
        limits.per_user.fill_frequency,
    );
    match store {
        RateLimitStore::Redis(_redis_config) => {
            let backend = RedisBackend::new(
                app_state
                    .0
                    .redis
                    .as_ref()
                    .expect("redis is required")
                    .clone(),
            );
            let limiter = build_limiter(backend, strategy);
            Either::Left(TowerRateLimiterLayer::new(
                limiter,
                RateLimitKeyExtractor,
            ))
        }
        RateLimitStore::InMemory => {
            let backend = brakes::backend::local::Memory::new();
            let limiter = build_limiter(backend, strategy);
            Either::Right(TowerRateLimiterLayer::new(
                limiter,
                RateLimitKeyExtractor,
            ))
        }
    }
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
    Enabled {
        service: Either<RedisRateLimitService<S>, InMemoryRateLimitService<S>>,
    },
    Disabled {
        service: S,
    },
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
    Either<RedisRateLimitService<S>, InMemoryRateLimitService<S>>:
        tower::Service<Request, Response = S::Response, Error = S::Error>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = ResponseFuture<
        <Either<RedisRateLimitService<S>, InMemoryRateLimitService<S>> as tower::Service<Request>>::Future,
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

fn build_limiter<B: brakes::backend::Backend>(
    backend: B,
    strategy: TokenBucket,
) -> RateLimiter<TokenBucket, B> {
    RateLimiter::builder()
        .with_backend(backend)
        .with_limiter(strategy)
        .with_failure_strategy(brakes::RetryStrategy::RetryAndDeny(1))
        .with_conflict_strategy(brakes::RetryStrategy::RetryAndDeny(1))
        .build()
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use pretty_assertions::assert_eq;

    use super::*;
    use crate::{
        app::AppState,
        config::{
            Config,
            rate_limit::{
                LimitConfig, RateLimitConfig, RateLimitStore, TokenBucketConfig,
            },
            router::{RouterConfig, RouterRateLimitConfig},
        },
        tests::TestDefault,
    };

    async fn create_test_app_state(
        rate_limit_config: RateLimitConfig,
    ) -> AppState {
        let mut config = Config::test_default();
        config.rate_limit = rate_limit_config;
        let app = crate::app::App::new(config)
            .await
            .expect("failed to create app");
        app.state
    }

    fn create_test_limits() -> LimitConfig {
        LimitConfig {
            per_user: TokenBucketConfig {
                capacity: 10,
                fill_frequency: Duration::from_secs(1),
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
        let app_state = create_test_app_state(RateLimitConfig::Global {
            store: RateLimitStore::InMemory,
            limits: create_test_limits(),
        })
        .await;
        let router_config = create_router_config(RouterRateLimitConfig::None);

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_none());
    }

    #[tokio::test]
    async fn global_app_with_custom_router() {
        let app_state = create_test_app_state(RateLimitConfig::Global {
            store: RateLimitStore::InMemory,
            limits: create_test_limits(),
        })
        .await;
        let router_config =
            create_router_config(RouterRateLimitConfig::Custom {
                limits: create_test_limits(),
            });

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_some());
    }

    #[tokio::test]
    async fn global_app_with_optin_router_should_error() {
        let app_state = create_test_app_state(RateLimitConfig::Global {
            store: RateLimitStore::InMemory,
            limits: create_test_limits(),
        })
        .await;
        let router_config = create_router_config(RouterRateLimitConfig::OptIn);

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_err());
        if let Err(error) = result {
            assert_eq!(
                error.to_string(),
                "Invalid rate limit config: App-level rate limiting does not \
                 allow rate limiting opt-in"
            );
        }
    }

    #[tokio::test]
    async fn optin_app_with_none_router() {
        let app_state = create_test_app_state(RateLimitConfig::OptIn {
            store: RateLimitStore::InMemory,
            limits: create_test_limits(),
        })
        .await;
        let router_config = create_router_config(RouterRateLimitConfig::None);

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_none());
    }

    #[tokio::test]
    async fn optin_app_with_optin_router() {
        let app_state = create_test_app_state(RateLimitConfig::OptIn {
            store: RateLimitStore::InMemory,
            limits: create_test_limits(),
        })
        .await;
        let router_config = create_router_config(RouterRateLimitConfig::OptIn);

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_some());
    }

    #[tokio::test]
    async fn optin_app_with_custom_router() {
        let app_state = create_test_app_state(RateLimitConfig::OptIn {
            store: RateLimitStore::InMemory,
            limits: create_test_limits(),
        })
        .await;
        let router_config =
            create_router_config(RouterRateLimitConfig::Custom {
                limits: create_test_limits(),
            });

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_some());
    }

    #[tokio::test]
    async fn router_specific_app_with_none_router() {
        let app_state =
            create_test_app_state(RateLimitConfig::RouterSpecific {
                store: RateLimitStore::InMemory,
            })
            .await;
        let router_config = create_router_config(RouterRateLimitConfig::None);

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_none());
    }

    #[tokio::test]
    async fn router_specific_app_with_custom_router() {
        let app_state =
            create_test_app_state(RateLimitConfig::RouterSpecific {
                store: RateLimitStore::InMemory,
            })
            .await;
        let router_config =
            create_router_config(RouterRateLimitConfig::Custom {
                limits: create_test_limits(),
            });

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_some());
    }

    #[tokio::test]
    async fn router_specific_app_with_optin_router_should_error() {
        let app_state =
            create_test_app_state(RateLimitConfig::RouterSpecific {
                store: RateLimitStore::InMemory,
            })
            .await;
        let router_config = create_router_config(RouterRateLimitConfig::OptIn);

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_err());
        if let Err(error) = result {
            assert_eq!(
                error.to_string(),
                "Invalid rate limit config: App-level rate limiting does not \
                 allow rate limiting opt-in"
            );
        }
    }

    #[tokio::test]
    async fn disabled_app_with_none_router() {
        let app_state = create_test_app_state(RateLimitConfig::Disabled).await;
        let router_config = create_router_config(RouterRateLimitConfig::None);

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_ok());
        assert!(result.unwrap().inner.is_none());
    }

    #[tokio::test]
    async fn disabled_app_with_custom_router_should_error() {
        let app_state = create_test_app_state(RateLimitConfig::Disabled).await;
        let router_config =
            create_router_config(RouterRateLimitConfig::Custom {
                limits: create_test_limits(),
            });

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_err());
        if let Err(error) = result {
            assert_eq!(
                error.to_string(),
                "Invalid rate limit config: Rate limiting is disabled at the \
                 app level"
            );
        }
    }

    #[tokio::test]
    async fn disabled_app_with_optin_router_should_error() {
        let app_state = create_test_app_state(RateLimitConfig::Disabled).await;
        let router_config = create_router_config(RouterRateLimitConfig::OptIn);

        let result = Layer::per_router(&app_state, &router_config);
        assert!(result.is_err());
        if let Err(error) = result {
            assert_eq!(
                error.to_string(),
                "Invalid rate limit config: Rate limiting is disabled at the \
                 app level"
            );
        }
    }
}
