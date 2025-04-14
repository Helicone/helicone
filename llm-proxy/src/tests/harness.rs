use http::{Request, Response};
use hyper::body::Incoming;
use tower::Service;

use crate::{app::App, config::Config, dispatcher::RespBody, error::api::Error};

pub struct Harness {
    pub app: App,
}

impl Harness {
    pub fn new(config: Config) -> Self {
        let app = App::new(config).unwrap();
        Self { app }
    }

    pub async fn call(&mut self, req: Request<Incoming>) -> Result<Response<RespBody>, Error> {
        self.app.service_stack.call(req).await
    }
}

