use std::{
    collections::HashMap,
    convert::Infallible,
    future::{Ready, ready},
    task::{Context, Poll},
};

use axum_core::response::IntoResponse;
use futures::future::Either;
use http::uri::PathAndQuery;
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

// Regex matching API calls (/v1/...)
// 1. ^/router                         – path must start with "/router"
// 2. Two main alternatives via non-capturing group `(?: ... | ... )`: a)
//    `/(?P<router_id> ID_PATTERN ) (?P<api_path_id_v1> /v1.* )`
//       - Matches `/`, captures router ID (UUID or Name) in `router_id`.
//       - Then matches `/v1` followed by anything (captured in
//         `api_path_id_v1`).
//    b) `(?P<api_path_def_v1> /v1.* )`
//       - Matches `/v1` followed by anything (captured in `api_path_def_v1`).
//         Used for RouterId::Default.
// 3. $                               – end of string.
const ROUTER_ID_REGEX: &str = r"^/router(?:/(?P<router_id>(?:[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}|[A-Za-z0-9_-]+))(?P<api_path_id_v1>/v1.*)|(?P<api_path_def_v1>/v1.*))$";

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
            DeploymentTarget::SelfHosted => Self::from_config(app_state).await,
            DeploymentTarget::Cloud | DeploymentTarget::Sidecar => {
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
        let meta_router = Self {
            inner,
            router_id_regex,
        };
        Ok((meta_router, ProviderMonitors::new(monitors)))
    }

    fn extract_router_id_and_path(
        &self,
        path: &str,
    ) -> Result<(RouterId, PathAndQuery), Error> {
        if let Some(captures) = self.router_id_regex.captures(path) {
            let router_id = if let Some(id_match) = captures.name("router_id") {
                let id_str = id_match.as_str();
                if let Ok(uuid) = Uuid::parse_str(id_str) {
                    RouterId::Uuid(uuid)
                } else {
                    RouterId::Named(id_str.into())
                }
            } else {
                RouterId::Default
            };

            let api_path = captures
                .name("api_path_id_v1")
                .or_else(|| captures.name("api_path_def_v1"))
                .map_or("", |m| m.as_str());

            if api_path.is_empty() {
                tracing::debug!(
                    "Regex matched but no api_path group captured for path: {}",
                    path
                );
                Err(Error::InvalidRequest(InvalidRequestError::NotFound(
                    path.to_string(),
                )))
            } else {
                Ok((
                    router_id,
                    PathAndQuery::try_from(api_path)
                        .map_err(InvalidRequestError::from)?,
                ))
            }
        } else {
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(
                path.to_string(),
            )))
        }
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

    fn call(
        &mut self,
        mut req: crate::types::request::Request,
    ) -> Self::Future {
        let (router_id, api_path) =
            match self.extract_router_id_and_path(req.uri().path()) {
                Ok(result) => result,
                Err(e) => {
                    return Either::Left(ready(Ok(e.into_response())));
                }
            };
        if let Some(router) = self.inner.get_mut(&router_id) {
            req.extensions_mut().insert(api_path);
            Either::Right(router.call(req))
        } else {
            Either::Left(ready(Ok(Error::InvalidRequest(
                InvalidRequestError::NotFound(req.uri().path().to_string()),
            )
            .into_response())))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_regex() {
        let regex = Regex::new(ROUTER_ID_REGEX).expect("Regex should be valid");

        // UUID paths
        assert!(regex.is_match(
            "/router/123e4567-e89b-12d3-a456-426614174000/v1/chat/completions"
        ));
        assert!(regex.is_match(
            "/router/123e4567-e89b-12d3-a456-426614174000/v1/some/other/path"
        ));

        // Named paths (must include /v1)
        assert!(regex.is_match("/router/my_router_name/v1/chat/completions"));
        assert!(regex.is_match(
            "/router/another_id-123/v1/anything/goes/here?query=param"
        ));
        assert!(
            regex
                .is_match("/router/my-router-with-hyphens/v1/chat/completions")
        );

        // Default paths (no specific ID)
        assert!(regex.is_match("/router/v1/chat/completions"));
        assert!(regex.is_match("/router/v1/completions"));

        assert!(!regex.is_match("/router"));
        assert!(!regex.is_match("/router/some-id"));
        assert!(
            !regex.is_match("/router/123e4567-e89b-12d3-a456-426614174000")
        );

        // Paths with trailing slash (should NOT match)
        assert!(!regex.is_match("/router/"));
        assert!(
            !regex.is_match("/router/123e4567-e89b-12d3-a456-426614174000/")
        );
        assert!(!regex.is_match("/router/my_router_name/"));

        // Invalid paths
        assert!(!regex.is_match("/other/path"));
        assert!(!regex.is_match("/router/invalid id/v1/path"));
        assert!(!regex.is_match("/router//v1/path"));
    }

    #[test]
    fn test_extract_router_id_and_path() {
        let meta_router = MetaRouter {
            inner: HashMap::new(),
            router_id_regex: Regex::new(ROUTER_ID_REGEX).unwrap(),
        };

        // UUID
        let uuid = Uuid::new_v4();
        let path = format!("/router/{}/v1/chat/completions", uuid);
        let expected_api_path = "/v1/chat/completions";
        assert_eq!(
            meta_router.extract_router_id_and_path(&path).unwrap(),
            (
                RouterId::Uuid(uuid),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Named
        let path = "/router/my_named_router/v1/completions";
        let expected_api_path = "/v1/completions";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Named("my_named_router".into()),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Named with hyphens
        let path = "/router/my-router-with-hyphens/v1/completions";
        let expected_api_path = "/v1/completions";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Named("my-router-with-hyphens".into()),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Default
        let path = "/router/v1/messages";
        let expected_api_path = "/v1/messages";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // UUID without /v1 segment or trailing /
        let path = format!("/router/{}", uuid);
        assert!(matches!(
            meta_router.extract_router_id_and_path(&path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Default without /v1 segment or trailing /
        let path = "/router";
        assert!(matches!(
            meta_router.extract_router_id_and_path(&path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        let path = "/router/some/custom/path?key=value";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Invalid Path
        let path = "/other/invalid/path";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Invalid UUID format (treated as Named)
        let path = "/router/not-a-uuid/v1/responses";
        let expected_api_path = "/v1/responses";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Named("not-a-uuid".into()),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Path with hyphens in named id
        let path = "/router/my-router-with-hyphens/v1/chat/completions";
        let expected_api_path = "/v1/chat/completions";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Named("my-router-with-hyphens".into()),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Trailing Slash Paths (should fail)
        let path = "/router/";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        let uuid_ui = Uuid::new_v4();
        let path = format!("/router/{}/", uuid_ui);
        assert!(matches!(
            meta_router.extract_router_id_and_path(&path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        let path = "/router/named_ui/";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Named path without /v1 or trailing slash (should fail)
        let path = "/router/just-name";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // --- Cases with Query Parameters ---

        // Default with query
        let path = "/router/v1/messages?user=test&limit=10";
        let expected_api_path = "/v1/messages?user=test&limit=10";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // UUID with query
        let path = format!("/router/{}/v1/chat?model=gpt4", uuid);
        let expected_api_path = "/v1/chat?model=gpt4";
        assert_eq!(
            meta_router.extract_router_id_and_path(&path).unwrap(),
            (
                RouterId::Uuid(uuid),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Named with query
        let path = "/router/my_router/v1/endpoint?id=123&flag=true";
        let expected_api_path = "/v1/endpoint?id=123&flag=true";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Named("my_router".into()),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Default with trailing slash and query
        let path = "/router/v1/?action=query";
        let expected_api_path = "/v1/?action=query";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // UUID with trailing slash and query
        let path = format!("/router/{}/v1/?action=query", uuid);
        let expected_api_path = "/v1/?action=query";
        assert_eq!(
            meta_router.extract_router_id_and_path(&path).unwrap(),
            (
                RouterId::Uuid(uuid),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Named with trailing slash and query
        let path = "/router/named_id/v1/?action=query";
        let expected_api_path = "/v1/?action=query";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Named("named_id".into()),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Default root path with query (invalid without /v1)
        let path = "/router?action=query";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // UUID root path with query (invalid without /v1)
        let path = format!("/router/{}?action=query", uuid);
        assert!(matches!(
            meta_router.extract_router_id_and_path(&path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Named root path with query (invalid without /v1)
        let path = "/router/named_id?action=query";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Default root path with trailing slash and query (invalid)
        let path = "/router/?action=query";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // UUID root path with trailing slash and query (invalid)
        let path = format!("/router/{}/?action=query", uuid);
        assert!(matches!(
            meta_router.extract_router_id_and_path(&path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Named root path with trailing slash and query (invalid)
        let path = "/router/named_id/?action=query";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Default root path with query (works with /v1)
        let path = "/router/v1?action=query";
        let expected_api_path = "/v1?action=query";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // UUID root path with query (works with /v1)
        let path = format!("/router/{}/v1?action=query", uuid);
        let expected_api_path = "/v1?action=query";
        assert_eq!(
            meta_router.extract_router_id_and_path(&path).unwrap(),
            (
                RouterId::Uuid(uuid),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // Named root path with query (works with /v1)
        let path = "/router/named_id/v1?action=query";
        let expected_api_path = "/v1?action=query";
        assert_eq!(
            meta_router.extract_router_id_and_path(path).unwrap(),
            (
                RouterId::Named("named_id".into()),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );
    }
}
