use std::{
    convert::Infallible,
    future::poll_fn,
    net::{IpAddr, Ipv4Addr, SocketAddr},
};

use futures::future::BoxFuture;
use tower::MakeService as _;

use super::mock::{Mock, MockArgs};
use crate::{
    app::{App, AppFactory, AppResponse},
    config::Config,
    types::request::Request,
};

pub const MOCK_SERVER_PORT: u16 = 8111;

#[derive(Default)]
pub struct HarnessBuilder {
    mock_args: Option<MockArgs>,
    config: Option<Config>,
}

impl HarnessBuilder {
    pub fn with_mock_args(mut self, mock_args: MockArgs) -> Self {
        self.mock_args = Some(mock_args);
        self
    }

    pub fn with_config(mut self, config: Config) -> Self {
        self.config = Some(config);
        self
    }

    pub async fn build(self) -> Harness {
        let config = self.config.expect("config is required");
        let mock_args = self
            .mock_args
            .unwrap_or_else(|| MockArgs::builder().build());
        Harness::new(mock_args, config).await
    }
}
pub struct Harness {
    pub app_factory: AppFactory<App>,
    pub mock: Mock,
    pub socket_addr: SocketAddr,
}

impl Harness {
    async fn new(mock_args: MockArgs, mut config: Config) -> Self {
        let mock = Mock::new(&mut config.providers, mock_args).await;
        let (app, _) = App::new(config).await.expect("failed to create app");
        let app_factory = AppFactory::new(app.state.clone(), app);
        let socket_addr =
            SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), 0);
        Self {
            app_factory,
            mock,
            socket_addr,
        }
    }

    pub fn builder() -> HarnessBuilder {
        HarnessBuilder::default()
    }
}

impl tower::Service<Request> for Harness {
    type Response = AppResponse;
    type Error = Infallible;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        tower::MakeService::poll_ready(&mut self.app_factory, cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        let mut factory = self.app_factory.clone();
        let socket_addr = self.socket_addr;
        std::mem::swap(&mut self.app_factory, &mut factory);
        Box::pin(async move {
            let mut app =
                factory.into_service().call(socket_addr).await.unwrap();
            // NOTE: we _MUST_ call poll_ready here, otherwise when we .call()
            // the app it will panic.
            poll_fn(|cx| tower::Service::poll_ready(&mut app, cx))
                .await
                .unwrap();

            app.call(req).await
        })
    }
}
