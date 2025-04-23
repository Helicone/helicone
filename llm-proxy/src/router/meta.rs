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

/// Currently only supports the default router
#[derive(Debug, Clone)]
pub struct MetaRouter {
    inner: HashMap<RouterId, Router>,
    router_id_regex: Regex,
}

impl MetaRouter {
    pub async fn new(
        app_state: AppState,
    ) -> Result<(Self, ProviderMonitors), InitError> {
        tracing::trace!("creating meta router");
        match app_state.0.config.deployment_target {
            DeploymentTarget::Sidecar => Self::from_config(app_state).await,
            DeploymentTarget::Cloud | DeploymentTarget::SelfHosted => {
                return Err(InitError::DeploymentTargetNotSupported(
                    app_state.0.config.deployment_target,
                ));
            }
        }
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
        let path = req.uri().path();

        let id = if let Some(captures) = self.router_id_regex.captures(path) {
            // Matched the UUID regex
            let Some(uuid_match) = captures.name("uuid") else {
                // Regex matched but capture group missing? Should not happen.
                let error = Error::InvalidRequest(
                    InvalidRequestError::InvalidRouterId(path.to_string()),
                );
                return Either::Left(ready(Ok(error.into_response())));
            };
            let Ok(uuid) = Uuid::parse_str(uuid_match.as_str()) else {
                // Invalid UUID format matched by regex? Should not happen.
                let error = Error::InvalidRequest(
                    InvalidRequestError::InvalidRouterId(path.to_string()),
                );
                return Either::Left(ready(Ok(error.into_response())));
            };
            RouterId::Uuid(uuid)
        } else if path.starts_with("/router") {
            RouterId::Default
        } else {
            // Path doesn't start with /router/ at all
            let error = Error::InvalidRequest(InvalidRequestError::NotFound);
            return Either::Left(ready(Ok(error.into_response())));
        };

        // Find the router based on the determined id
        let Some(router) = self.inner.get_mut(&id) else {
            // RouterId::Default or a valid RouterId::Uuid doesn't exist in the
            // map
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
    }
}
