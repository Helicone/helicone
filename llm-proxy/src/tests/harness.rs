use http::{Request, Response};
use stubr::{Stubr, wiremock_rs::MockServer};
use tower::Service;

use crate::{
    app::App, config::Config, dispatcher::RespBody, error::api::Error,
};

pub struct Harness {
    pub app: App<reqwest::Body>,
    pub mock: MockServer,
}

impl Harness {
    pub async fn new(config: Config) -> Self {
        let app = App::new(config).unwrap();
        let mock = Stubr::try_start("./stubs")
            .await
            .expect("couldnt start mock htttp server");
        Self {
            app,
            mock: mock.http_server,
        }
    }

    pub async fn call(
        &mut self,
        req: Request<reqwest::Body>,
    ) -> Result<Response<RespBody>, Error> {
        self.app.service_stack.call(req).await
    }
}
