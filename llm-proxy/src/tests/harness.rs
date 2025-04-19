use stubr::{Stubr, wiremock_rs::MockServer};
use tower::Service;

use crate::{
    app::TestApp,
    config::Config,
    error::api::Error,
    types::{request::Request, response::Response},
};

pub struct Harness {
    pub app: TestApp,
    pub mock: MockServer,
}

impl Harness {
    pub async fn new(config: Config) -> Self {
        let app = TestApp::new(config).await.expect("failed to create app");
        let mock = Stubr::try_start("./stubs")
            .await
            .expect("couldnt start mock htttp server");
        Self {
            app,
            mock: mock.http_server,
        }
    }

    pub async fn call(&mut self, req: Request) -> Result<Response, Error> {
        self.app.inner.call(req).await
    }
}
