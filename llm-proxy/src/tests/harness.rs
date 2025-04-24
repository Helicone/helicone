use std::convert::Infallible;

use futures::future::BoxFuture;
use stubr::{Stubr, wiremock_rs::MockServer};

use crate::{
    app::App,
    config::Config,
    types::{request::Request, response::Response},
};

pub struct Harness {
    pub app: App,
    pub mock: MockServer,
}

impl Harness {
    pub async fn new(config: Config) -> Self {
        let (app, _) = App::new(config).await.expect("failed to create app");
        let mock = Stubr::try_start("./stubs")
            .await
            .expect("couldnt start mock htttp server");
        Self {
            app,
            mock: mock.http_server,
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
        self.app.poll_ready(cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        self.app.call(req)
    }
}
