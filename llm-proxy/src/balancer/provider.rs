use std::{
    sync::Arc,
    task::{Context, Poll},
};

use futures::Future;
use pin_project_lite::pin_project;
use tokio::sync::mpsc::channel;
use tower::{Service, balance::p2c::Balance, load::PeakEwmaDiscover};
use weighted_balance::{balance::WeightedBalance, weight::WeightedDiscover};

use crate::{
    app::AppState,
    config::{balance::BalanceConfigInner, router::RouterConfig},
    discover::{
        provider::{Key, discover, factory::DiscoverFactory},
        weighted::WeightedKey,
    },
    error::{api::Error, init::InitError, internal::InternalError},
    types::{request::Request, response::Response, router::RouterId},
};

const CHANNEL_CAPACITY: usize = 128;

#[derive(Debug)]
pub enum ProviderBalancer {
    PeakEwma(Balance<PeakEwmaDiscover<discover::Discovery<Key>>, Request>),
    Weighted(
        WeightedBalance<
            WeightedDiscover<discover::Discovery<WeightedKey>>,
            Request,
        >,
    ),
}

impl ProviderBalancer {
    pub async fn new(
        app_state: AppState,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
        balance_config: &BalanceConfigInner,
    ) -> Result<ProviderBalancer, InitError> {
        match balance_config {
            BalanceConfigInner::Weighted { .. } => {
                Self::weighted(app_state, router_id, router_config).await
            }
            BalanceConfigInner::P2C { .. } => {
                Self::peak_ewma(app_state, router_id, router_config).await
            }
        }
    }

    async fn weighted(
        app_state: AppState,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
    ) -> Result<ProviderBalancer, InitError> {
        tracing::debug!("Creating weighted balancer");
        let (tx, rx) = channel(CHANNEL_CAPACITY);
        let discover_factory =
            DiscoverFactory::new(app_state.clone(), router_config.clone());
        let mut balance_factory =
            weighted_balance::balance::make::MakeBalance::new(discover_factory);
        let balance = balance_factory.call(rx).await?;
        app_state
            .add_weighted_router_health_monitor(router_id, router_config, tx)
            .await;
        let provider_balancer = ProviderBalancer::Weighted(balance);

        Ok(provider_balancer)
    }

    async fn peak_ewma(
        app_state: AppState,
        router_id: RouterId,
        router_config: Arc<RouterConfig>,
    ) -> Result<ProviderBalancer, InitError> {
        tracing::debug!("Creating peak ewma p2c balancer");
        let (tx, rx) = channel(CHANNEL_CAPACITY);
        let discover_factory =
            DiscoverFactory::new(app_state.clone(), router_config.clone());
        let mut balance_factory =
            tower::balance::p2c::MakeBalance::new(discover_factory);
        let balance = balance_factory.call(rx).await?;
        app_state
            .add_p2c_router_health_monitor(router_id, router_config, tx)
            .await;
        let provider_balancer = ProviderBalancer::PeakEwma(balance);

        Ok(provider_balancer)
    }
}

impl tower::Service<Request> for ProviderBalancer {
    type Response = Response;
    type Error = Error;
    type Future = ResponseFuture;

    #[inline]
    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        match self {
            ProviderBalancer::PeakEwma(inner) => inner.poll_ready(cx),
            ProviderBalancer::Weighted(inner) => inner.poll_ready(cx),
        }
        .map_err(InternalError::PollReadyError)
        .map_err(Into::into)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        tracing::trace!("ProviderBalancer");
        match self {
            ProviderBalancer::PeakEwma(inner) => ResponseFuture::PeakEwma {
                future: inner.call(req),
            },
            ProviderBalancer::Weighted(inner) => ResponseFuture::Weighted {
                future: inner.call(req),
            },
        }
    }
}

pin_project! {
    #[project = EnumProj]
    pub enum ResponseFuture {
        PeakEwma {
            #[pin]
            future: <
                Balance<PeakEwmaDiscover<discover::Discovery<Key>>, Request> as tower::Service<
                    Request,
                >
            >::Future,
        },
        Weighted {
            #[pin]
            future: <
                WeightedBalance<WeightedDiscover<discover::Discovery<WeightedKey>>, Request> as tower::Service<
                    Request,
                >
            >::Future,
        },
    }
}

impl Future for ResponseFuture {
    type Output = Result<Response, Error>;

    fn poll(
        self: std::pin::Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Self::Output> {
        match self.project() {
            EnumProj::PeakEwma { future } => match future.poll(cx) {
                Poll::Ready(Ok(res)) => Poll::Ready(Ok(res)),
                Poll::Ready(Err(e)) => Poll::Ready(Err(Error::Internal(
                    InternalError::LoadBalancerError(e),
                ))),
                Poll::Pending => Poll::Pending,
            },
            EnumProj::Weighted { future } => match future.poll(cx) {
                Poll::Ready(Ok(res)) => Poll::Ready(Ok(res)),
                Poll::Ready(Err(e)) => Poll::Ready(Err(Error::Internal(
                    InternalError::LoadBalancerError(e),
                ))),
                Poll::Pending => Poll::Pending,
            },
        }
    }
}
