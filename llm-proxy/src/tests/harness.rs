use http::{Request, Response};
use wiremock::Mock;
use tower::Service;

use crate::{app::App, config::Config, dispatcher::RespBody, error::api::Error};

pub struct HarnessBuilder {
    pub app: App<reqwest::Body>,
}

impl HarnessBuilder {
    pub fn new(config: Config) -> Self {
        let app = App::new(config).unwrap();
        Self { app }
    }

    pub fn build(self) -> Harness {
        Harness { app: self.app, mock: None }
    }
}

pub struct Harness {
    pub app: App<reqwest::Body>,
    pub mock: Option<Mock>,
}

impl Harness {
    pub fn builder(config: Config) -> HarnessBuilder {
        let app = App::new(config).unwrap();
        HarnessBuilder { app }
    }

    pub async fn call(&mut self, req: Request<reqwest::Body>) -> Result<Response<RespBody>, Error> {
        self.app.service_stack.call(req).await
    }
}

