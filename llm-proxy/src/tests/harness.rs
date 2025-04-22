use stubr::{Stubr, wiremock_rs::MockServer};
use tower::Service;

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

    pub async fn call(&mut self, req: Request) -> Response {
        self.app.call(req).await.expect("result type is infallible")
    }
}
