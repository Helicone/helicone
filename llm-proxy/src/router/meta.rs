use std::{
    collections::HashMap,
    convert::Infallible,
    future::{Ready, ready},
    task::{Context, Poll},
};

use axum_core::response::IntoResponse;
use futures::future::Either;
use regex::Regex;
use uuid::Uuid;

use super::{Router, RouterService};
use crate::{
    app::AppState,
    config::DeploymentTarget,
    discover::provider::monitor::ProviderMonitors,
    error::{api::Error, init::InitError, invalid_req::InvalidRequestError},
    types::router::RouterId,
};

const ROUTER_ID_REGEX: &str = r"^/router/(?P<uuid>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:/.*)?$";

#[derive(Debug)]
pub struct MetaRouter {
    inner: HashMap<RouterId, Router>,
    router_id_regex: Regex,
}

impl MetaRouter {
    pub async fn new(
        app_state: AppState,
    ) -> Result<(Self, ProviderMonitors), InitError> {
        let meta_router = match app_state.0.config.deployment_target {
            DeploymentTarget::Sidecar => Self::from_config(app_state).await,
            DeploymentTarget::Cloud | DeploymentTarget::SelfHosted => {
                return Err(InitError::DeploymentTargetNotSupported(
                    app_state.0.config.deployment_target,
                ));
            }
        }?;
        tracing::trace!(
            num_routers = meta_router.0.inner.len(),
            "meta router created"
        );
        Ok(meta_router)
    }

    pub async fn from_config(
        app_state: AppState,
    ) -> Result<(Self, ProviderMonitors), InitError> {
        let router_id_regex =
            Regex::new(ROUTER_ID_REGEX).expect("always valid if tests pass");
        let mut inner =
            HashMap::with_capacity(app_state.0.config.routers.as_ref().len());
        let mut monitors =
            HashMap::with_capacity(app_state.0.config.routers.as_ref().len());
        for router_id in app_state.0.config.routers.as_ref().keys() {
            let (router, monitor) =
                Router::new(router_id.clone(), app_state.clone()).await?;
            monitors.insert(router_id.clone(), monitor);
            inner.insert(router_id.clone(), router);
        }
        tracing::debug!(num_routers = inner.len(), "meta router created");
        let meta_router = Self {
            inner,
            router_id_regex,
        };
        Ok((meta_router, ProviderMonitors::new(monitors)))
    }

    fn extract_router_id(&self, path: &str) -> Result<RouterId, Error> {
        let id = if let Some(captures) = self.router_id_regex.captures(path) {
            let Some(uuid_match) = captures.name("uuid") else {
                return Err(Error::InvalidRequest(
                    InvalidRequestError::InvalidRouterId(path.to_string()),
                ));
            };
            let Ok(uuid) = Uuid::parse_str(uuid_match.as_str()) else {
                return Err(Error::InvalidRequest(
                    InvalidRequestError::InvalidRouterId(path.to_string()),
                ));
            };
            RouterId::Uuid(uuid)
        } else if path.starts_with("/router") {
            RouterId::Default
        } else {
            return Err(Error::InvalidRequest(InvalidRequestError::NotFound));
        };
        Ok(id)
    }
}

impl tower::Service<crate::types::request::Request> for MetaRouter {
    type Response = crate::types::response::Response;
    type Error = Infallible;
    type Future = Either<
        Ready<Result<Self::Response, Self::Error>>,
        <RouterService as tower::Service<
            crate::types::request::Request,
        >>::Future,
    >;

    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        tracing::trace!("MetaRouter::poll_ready");
        let mut any_pending = false;
        for router in self.inner.values_mut() {
            if router.poll_ready(ctx).is_pending() {
                any_pending = true;
            }
        }
        if any_pending {
            Poll::Pending
        } else {
            Poll::Ready(Ok(()))
        }
    }

    fn call(&mut self, req: crate::types::request::Request) -> Self::Future {
        let router_id = match self.extract_router_id(&req.uri().path()) {
            Ok(id) => id,
            Err(e) => {
                return Either::Left(ready(Ok(e.into_response())));
            }
        };

        if let Some(router) = self.inner.get_mut(&router_id) {
            return Either::Right(router.call(req));
        } else {
            return Either::Left(ready(Ok(Error::InvalidRequest(
                InvalidRequestError::NotFound,
            )
            .into_response())));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_regex() {
        let regex = Regex::new(ROUTER_ID_REGEX);
        assert!(regex.is_ok());
    }
}
