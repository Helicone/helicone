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
    discover::provider::monitor::ProviderMonitor,
    error::{api::Error, invalid_req::InvalidRequestError},
    types::router::RouterId,
};

const ROUTER_ID_REGEX: &str = r"^/router/(?P<router_id>[a-zA-Z0-9_-]+)$";

/// Currently only supports the default router
#[derive(Debug, Clone)]
pub struct MetaRouter {
    inner: HashMap<RouterId, Router>,
    regex: Regex,
}

impl MetaRouter {
    pub fn default_only(app_state: AppState) -> (Self, ProviderMonitor) {
        let regex =
            Regex::new(ROUTER_ID_REGEX).expect("always valid if tests pass");
        let (router, monitor) = Router::new(app_state);
        let meta_router = Self {
            inner: HashMap::from([(RouterId::Default, router)]),
            regex,
        };

        (meta_router, monitor)
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
        let id = if path == "/router" {
            RouterId::Default
        } else {
            // we manually handle the error here not for any particular reason
            // its just a bit tiresome to repeatedly stack the HandleError
            // layers.
            let Some(Some(router_id_match)) =
                self.regex.captures(path).map(|c| c.name("router_id"))
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
            RouterId::Slug(uuid)
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
    }
}
