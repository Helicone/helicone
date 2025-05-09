use std::sync::Arc;

use tower::MakeService;

use crate::{app::AppState, config::router::RouterConfig, error::api::Error, types::{request::Request, response::Response}};

pub struct DispatcherConstructorArgs {
    pub app_state: AppState,
    pub provider: InferenceProvider,
}

impl DispatcherConstructorArgs {
    pub fn new(app_state: AppState, provider: InferenceProvider) -> Self {
        Self { app_state, provider }
    }
}

pub struct DispatcherFactory {
    pub(crate) app_state: AppState,
    pub(crate) router_config: Arc<RouterConfig>,
}

impl DispatcherFactory {
    pub fn new(app_state: AppState, router_config: Arc<RouterConfig>) -> Self {
        Self { app_state, router_config }
    }
}

impl MakeService<DispatcherConstructorArgs, Request> for DispatcherFactory {
    type Response = Response;
    type Error = Error;
    type Service;

    type MakeError;

    type Future;

    fn poll_ready(&mut self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::MakeError>> {
        todo!()
    }

    fn make_service(&mut self, target: DispatcherConstructorArgs) -> Self::Future {
        todo!()
    }
}


