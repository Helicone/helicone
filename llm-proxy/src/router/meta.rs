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
const DEFAULT_ROUTER_REGEX: &str = r"^/router/(?![0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?:/|$))[^/]+(?:/.*)?$";

/// Currently only supports the default router
#[derive(Debug, Clone)]
pub struct MetaRouter {
    inner: HashMap<RouterId, Router>,
    router_id_regex: Regex,
    default_router_regex: Regex,
}

impl MetaRouter {
    pub fn new(
        app_state: AppState,
    ) -> Result<(Self, ProviderMonitors), InitError> {
        tracing::trace!("creating meta router");
        match app_state.0.config.deployment_target {
            DeploymentTarget::Sidecar => Self::from_config(app_state),
            DeploymentTarget::Cloud | DeploymentTarget::SelfHosted => {
                return Err(InitError::DeploymentTargetNotSupported(
                    app_state.0.config.deployment_target,
                ));
            }
        }
    }

    pub fn from_config(
        app_state: AppState,
    ) -> Result<(Self, ProviderMonitors), InitError> {
        let router_id_regex =
            Regex::new(ROUTER_ID_REGEX).expect("always valid if tests pass");
        let default_router_regex = Regex::new(DEFAULT_ROUTER_REGEX)
            .expect("always valid if tests pass");
        let mut inner =
            HashMap::with_capacity(app_state.0.config.routers.as_ref().len());
        let mut monitors =
            HashMap::with_capacity(app_state.0.config.routers.as_ref().len());
        for router_id in app_state.0.config.routers.as_ref().keys() {
            let (router, monitor) =
                Router::new(router_id.clone(), app_state.clone())?;
            monitors.insert(router_id.clone(), monitor);
            inner.insert(router_id.clone(), router);
        }
        let meta_router = Self {
            inner,
            router_id_regex,
            default_router_regex,
        };
        Ok((meta_router, ProviderMonitors::new(monitors)))
    }
}

impl tower::Service<crate::types::request::Request> for MetaRouter {
    type Response = crate::types::response::Response;
    type Error = Infallible;
    type Future = Either<
        Ready<Result<Self::Response, Self::Error>>,
        <RouterService as tower::Service<crate::types::request::Request>>::Future,
    >;

    fn poll_ready(
        &mut self,
        ctx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
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
        let path = req.uri().path();
        let id = if self.default_router_regex.is_match(path) {
            RouterId::Default
        } else {
            // we manually handle the error here not for any particular reason
            // its just a bit tiresome to repeatedly stack the HandleError
            // layers.
            let Some(Some(router_id_match)) =
                self.router_id_regex.captures(path).map(|c| c.name("uuid"))
            else {
                let error = Error::InvalidRequest(
                    InvalidRequestError::InvalidRouterId(path.to_string()),
                );
                return Either::Left(ready(Ok(error.into_response())));
            };
            let Ok(uuid) = Uuid::parse_str(router_id_match.as_str()) else {
                let error = Error::InvalidRequest(
                    InvalidRequestError::InvalidRouterId(path.to_string()),
                );
                return Either::Left(ready(Ok(error.into_response())));
            };
            RouterId::Uuid(uuid)
        };
        let Some(router) = self.inner.get_mut(&id) else {
            let error = Error::InvalidRequest(InvalidRequestError::NotFound);
            return Either::Left(ready(Ok(error.into_response())));
        };
        Either::Right(router.call(req))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_regex() {
        let regex = Regex::new(ROUTER_ID_REGEX);
        assert!(regex.is_ok());
        let regex = Regex::new(DEFAULT_ROUTER_REGEX);
        assert!(regex.is_ok());
    }
}
