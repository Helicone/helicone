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
    error::{
        api::Error, init::InitError, internal::InternalError,
        invalid_req::InvalidRequestError,
    },
    types::router::RouterId,
};

// Regex matching API calls starting with "/router":
// 1. ^/router(?: ... )?$
//    - Path must start with "/router". The part after is optional.
//    - Alternatives for the optional part:
// 2. `/(?P<router_uuid_val>UUID_PATTERN)(?P<api_path_after_uuid>.*)?`
//    - Matches `/` + UUID. `api_path_after_uuid` captures the rest (e.g.,
//      "/foo", "?q=b", or empty).
// 3. `(?P<api_path_default>/.+)`
//    - Matches a default path starting with `/` (e.g., "/v1/bar").
// 4. `(?P<api_path_query_only>\?[^/].*)`
//    - Matches a query string immediately after "/router" (e.g., "?q=b").
//      `[^/]` prevents conflict.
const ROUTER_ID_REGEX: &str = r"^/router(?:/(?P<router_uuid_val>[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12})(?P<api_path_after_uuid>.*)?|(?P<api_path_default>/.+)|(?P<api_path_query_only>\?[^/].*))?$";

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
        tracing::info!(
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
            let router_id: RouterId;
            let mut extracted_sub_path_component: &str = ""; // Stores the raw captured sub-path

            if let Some(uuid_match) = captures.name("router_uuid_val") {
                let uuid_str = uuid_match.as_str();
                if let Ok(uuid) = Uuid::parse_str(uuid_str) {
                    router_id = RouterId::Uuid(uuid);
                    if let Some(path_after_uuid_match) =
                        captures.name("api_path_after_uuid")
                    {
                        extracted_sub_path_component =
                            path_after_uuid_match.as_str();
                    }
                    // extracted_sub_path_component can be "", "/foo",
                    // "?query"
                } else {
                    // This should **never** happen if our regex is correct
                    tracing::warn!(
                        "Path segment '{}' matched UUID pattern but failed to \
                         parse as UUID for path: {}",
                        uuid_str,
                        path
                    );
                    return Err(Error::Internal(InternalError::Internal));
                }
            } else {
                // No UUID matched, so it's a Default Router ID
                router_id = RouterId::Default;
                if let Some(default_path_match) =
                    captures.name("api_path_default")
                {
                    // Matched /.+
                    extracted_sub_path_component = default_path_match.as_str(); // e.g., "/foo", "/?query"
                } else if let Some(query_only_match) =
                    captures.name("api_path_query_only")
                {
                    // Matched \?[^/].*
                    extracted_sub_path_component = query_only_match.as_str(); // e.g., "?query"
                }
                // If path was just "/router", all optional groups are None, so
                // extracted_sub_path_component remains ""
            }

            // Determine the final string for PathAndQuery construction
            // If component is empty (e.g. "/router" or "/router/UUID"), path is
            // "/". Otherwise, use the component as is (e.g. "/foo",
            // "/?q=b", or potentially invalid "?q=b").
            let final_path_and_query_str =
                if extracted_sub_path_component.is_empty() {
                    "/"
                } else {
                    extracted_sub_path_component
                };

            match PathAndQuery::try_from(final_path_and_query_str) {
                Ok(parsed_api_path) => Ok((router_id, parsed_api_path)),
                Err(e) => {
                    tracing::warn!(
                        "Failed to convert extracted path '{}' to \
                         PathAndQuery for original path '{}': {:?}",
                        final_path_and_query_str,
                        path,
                        e
                    );
                    Err(Error::Internal(InternalError::Internal))
                }
            }
        } else {
            // Regex did not match the path at all (e.g. path doesn't start with
            // /router)
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
        tracing::trace!(
            router_id = router_id.to_string(),
            api_path = api_path.to_string(),
            "MetaRouter received request"
        );
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
        assert!(regex.is_match(
            // UUID only
            "/router/123e4567-e89b-12d3-a456-426614174000"
        ));
        assert!(regex.is_match(
            // UUID with trailing slash
            "/router/123e4567-e89b-12d3-a456-426614174000/"
        ));

        // Default paths (previously "Named" or "Default" can now be general
        // Default paths)
        assert!(regex.is_match("/router/some-id"));
        assert!(regex.is_match("/router/some-id/"));

        // Default paths (explicit /v1 or other segments)
        assert!(regex.is_match("/router/v1/chat/completions"));
        assert!(regex.is_match("/router/v1/completions"));

        // Root router paths
        assert!(regex.is_match("/router"));

        assert!(!regex.is_match("/other/path"));
        assert!(!regex.is_match("/router/"));

        // Paths that might seem invalid but the regex is permissive for the
        // path part
        assert!(regex.is_match("/router//v1/path"));

        // Paths with only query params (regex matches, but extraction might
        // fail on PathAndQuery)
        assert!(regex.is_match("/router?query=param"));
        assert!(regex.is_match("/router/?query=param"));
        assert!(regex.is_match(
            "/router/123e4567-e89b-12d3-a456-426614174000?query=param"
        ));
        assert!(regex.is_match(
            "/router/123e4567-e89b-12d3-a456-426614174000/?query=param"
        ));
    }

    #[test]
    fn test_extract_router_id_and_path() {
        let meta_router = MetaRouter {
            inner: HashMap::new(),
            router_id_regex: Regex::new(ROUTER_ID_REGEX).unwrap(),
        };

        let uuid = Uuid::new_v4();

        // UUID with API path
        let path = format!("/router/{uuid}/v1/chat/completions");
        let expected_api_path = "/v1/chat/completions";
        assert_eq!(
            meta_router.extract_router_id_and_path(&path).unwrap(),
            (
                RouterId::Uuid(uuid),
                PathAndQuery::try_from(expected_api_path).unwrap()
            )
        );

        // UUID only (should default to API path "/")
        let path_uuid_only = format!("/router/{uuid}");
        assert_eq!(
            meta_router
                .extract_router_id_and_path(&path_uuid_only)
                .unwrap(),
            (RouterId::Uuid(uuid), PathAndQuery::try_from("/").unwrap())
        );

        // UUID with trailing slash (should default to API path "/")
        let path_uuid_trailing_slash = format!("/router/{uuid}/");
        assert_eq!(
            meta_router
                .extract_router_id_and_path(&path_uuid_trailing_slash)
                .unwrap(),
            (RouterId::Uuid(uuid), PathAndQuery::try_from("/").unwrap())
        );

        // Default with specific API path
        let path_default_specific = "/router/v1/messages";
        let expected_api_path_default_specific = "/v1/messages";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_specific)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path_default_specific)
                    .unwrap()
            )
        );

        // Default router root (path "/router")
        let path_default_root = "/router";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_root)
                .unwrap(),
            (RouterId::Default, PathAndQuery::try_from("/").unwrap())
        );

        // Default router root with trailing slash (path "/router/")
        let path_default_root_trailing_slash = "/router";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_root_trailing_slash)
                .unwrap(),
            (RouterId::Default, PathAndQuery::try_from("/").unwrap())
        );

        // Default with a non-UUID, non-/v1 segment as path
        let path_default_custom_segment = "/router/my-custom-path/data";
        let expected_api_path_custom_segment = "/my-custom-path/data";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_custom_segment)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path_custom_segment)
                    .unwrap()
            )
        );

        // Default with a path that looks like a named ID previously
        let path_prev_named = "/router/my_named_router/v1/completions";
        let expected_api_path_prev_named = "/my_named_router/v1/completions";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_prev_named)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path_prev_named).unwrap()
            )
        );

        // Invalid path (does not start with /router)
        let path_invalid_base = "/other/invalid/path";
        assert!(matches!(
            meta_router.extract_router_id_and_path(path_invalid_base),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Path that looks like an invalid UUID but is treated as a default path
        // segment
        let path_not_a_uuid_segment = "/router/not-a-uuid/v1/responses";
        let expected_api_path_not_a_uuid = "/not-a-uuid/v1/responses";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_not_a_uuid_segment)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path_not_a_uuid).unwrap()
            )
        );

        // --- Cases with Query Parameters ---

        // Default with API path and query
        let path_default_query = "/router/v1/messages?user=test&limit=10";
        let expected_api_path_default_query = "/v1/messages?user=test&limit=10";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_query)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path_default_query)
                    .unwrap()
            )
        );

        // UUID with API path and query
        let path_uuid_query = format!("/router/{uuid}/v1/chat?model=gpt4");
        let expected_api_path_uuid_query = "/v1/chat?model=gpt4";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(&path_uuid_query)
                .unwrap(),
            (
                RouterId::Uuid(uuid),
                PathAndQuery::try_from(expected_api_path_uuid_query).unwrap()
            )
        );

        // Default with API path (that used to be "named") and query
        let path_default_custom_query =
            "/router/my_router/v1/endpoint?id=123&flag=true";
        let expected_api_path_default_custom_query =
            "/my_router/v1/endpoint?id=123&flag=true";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_custom_query)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path_default_custom_query)
                    .unwrap()
            )
        );

        // Default with API path, trailing slash, and query
        let path_default_slash_query = "/router/v1/?action=query";
        let expected_api_path_default_slash_query = "/v1/?action=query";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_slash_query)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_api_path_default_slash_query)
                    .unwrap()
            )
        );

        // UUID with API path, trailing slash, and query
        let path_uuid_slash_query = format!("/router/{uuid}/v1/?action=query");
        let expected_api_path_uuid_slash_query = "/v1/?action=query";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(&path_uuid_slash_query)
                .unwrap(),
            (
                RouterId::Uuid(uuid),
                PathAndQuery::try_from(expected_api_path_uuid_slash_query)
                    .unwrap()
            )
        );

        // --- Cases where regex matches but PathAndQuery::try_from might fail
        // --- These paths have query strings but lack a leading '/' for
        // the path component if not part of a longer path.

        // Default router root with only query (e.g. /router?action=query) ->
        // API path "?action=query" (invalid for PathAndQuery)
        let path_default_root_only_query = "/router?action=query";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_root_only_query)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from("?action=query").unwrap()
            )
        );

        // UUID root with only query (e.g. /router/{uuid}?action=query) -> API
        // path "?action=query" (invalid for PathAndQuery)
        let path_uuid_root_only_query = format!("/router/{uuid}?action=query");
        assert_eq!(
            meta_router
                .extract_router_id_and_path(&path_uuid_root_only_query)
                .unwrap(),
            (
                RouterId::Uuid(uuid),
                PathAndQuery::try_from("?action=query").unwrap()
            )
        );

        // Default router root with slash and query (e.g. /router/?action=query)
        // -> API path "/?action=query" (VALID for PathAndQuery)
        let path_default_root_slash_query = "/router/?action=query";
        let expected_path_default_root_slash_query = "/?action=query";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_root_slash_query)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_path_default_root_slash_query)
                    .unwrap()
            )
        );

        // UUID root with slash and query (e.g. /router/{uuid}/?action=query) ->
        // API path "/?action=query" (VALID for PathAndQuery)
        let path_uuid_root_slash_query =
            format!("/router/{uuid}/?action=query");
        let expected_path_uuid_root_slash_query = "/?action=query";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(&path_uuid_root_slash_query)
                .unwrap(),
            (
                RouterId::Uuid(uuid),
                PathAndQuery::try_from(expected_path_uuid_root_slash_query)
                    .unwrap()
            )
        );

        // Default path (that used to be named) with query
        let path_default_was_named_query = "/router/named_id/v1?action=query";
        let expected_path_default_was_named_query = "/named_id/v1?action=query";
        assert_eq!(
            meta_router
                .extract_router_id_and_path(path_default_was_named_query)
                .unwrap(),
            (
                RouterId::Default,
                PathAndQuery::try_from(expected_path_default_was_named_query)
                    .unwrap()
            )
        );
    }
}
