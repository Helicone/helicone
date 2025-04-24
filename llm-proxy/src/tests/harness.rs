use std::{
    convert::Infallible,
    future::poll_fn,
    net::{IpAddr, Ipv4Addr, SocketAddr},
};

use futures::future::BoxFuture;
use stubr::{Stubr, wiremock_rs::MockServer};
use tower::MakeService as _;

use crate::{
    app::{App, AppFactory},
    config::Config,
    types::{request::Request, response::Response},
};

pub struct Harness {
    pub app_factory: AppFactory<App>,
    pub mock: MockServer,
    pub socket_addr: SocketAddr,
}

impl Harness {
    pub async fn new(config: Config) -> Self {
        let (app, _) = App::new(config).await.expect("failed to create app");
        let mock = Stubr::try_start("./stubs")
            .await
            .expect("couldnt start mock htttp server");
        let app_factory = AppFactory::new(app.state.clone(), app);
        let socket_addr =
            SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), 0);
        Self {
            app_factory,
            mock: mock.http_server,
            socket_addr,
        }
    }
}

impl tower::Service<Request> for Harness {
    type Response = Response;
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
