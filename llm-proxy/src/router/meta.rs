use std::{
    future::{Ready, ready},
    task::{Context, Poll},
};

use axum_core::response::IntoResponse;
use futures::future::Either;
use http::uri::PathAndQuery;
use regex::Regex;
use rustc_hash::FxHashMap as HashMap;
use uuid::Uuid;

use super::Router;
use crate::{
    app::AppState,
    config::DeploymentTarget,
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
    pub async fn new(app_state: AppState) -> Result<Self, InitError> {
        let meta_router = match app_state.0.config.deployment_target {
            DeploymentTarget::SelfHosted => Self::from_config(app_state).await,
            DeploymentTarget::Cloud { .. } | DeploymentTarget::Sidecar => {
                return Err(InitError::DeploymentTargetNotSupported(
                    app_state.0.config.deployment_target.clone(),
                ));
            }
        }?;
        tracing::info!(
            num_routers = meta_router.inner.len(),
            "meta router created"
        );
        Ok(meta_router)
    }

    pub async fn from_config(app_state: AppState) -> Result<Self, InitError> {
        let router_id_regex =
            Regex::new(ROUTER_ID_REGEX).expect("always valid if tests pass");
        let mut inner = HashMap::default();
        for router_id in app_state.0.config.routers.as_ref().keys() {
            let router = Router::new(*router_id, app_state.clone()).await?;
            inner.insert(*router_id, router);
        }
        let meta_router = Self {
            inner,
            router_id_regex,
        };
        Ok(meta_router)
    }
}

impl tower::Service<crate::types::request::Request> for MetaRouter {
    type Response = crate::types::response::Response;
    type Error = Error;
    type Future = Either<
        Ready<Result<Self::Response, Self::Error>>,
        <Router as tower::Service<crate::types::request::Request>>::Future,
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
        let (router_id, api_path) = match extract_router_id_and_path(
            &self.router_id_regex,
            req.uri().path(),
        ) {
            Ok(result) => result,
            Err(e) => {
                return Either::Left(ready(Ok(e.into_response())));
            }
        };
        tracing::trace!(
            router_id = router_id.to_string(),
            api_path = api_path,
            "MetaRouter received request"
        );
        let extracted_path_and_query =
            if let Some(query_params) = req.uri().query() {
                PathAndQuery::try_from(format!("{api_path}?{query_params}"))
            } else {
                PathAndQuery::try_from(api_path)
            };

        let extracted_path_and_query = match extracted_path_and_query {
            Ok(path_and_query) => path_and_query,
            Err(_e) => {
                tracing::warn!(
                    "Failed to convert extracted path to PathAndQuery"
                );
                return Either::Left(ready(Ok(Error::Internal(
                    InternalError::Internal,
                )
                .into_response())));
            }
        };
        if let Some(router) = self.inner.get_mut(&router_id) {
            req.extensions_mut().insert(extracted_path_and_query);
            Either::Right(router.call(req))
        } else {
            Either::Left(ready(Ok(Error::InvalidRequest(
                InvalidRequestError::NotFound(req.uri().path().to_string()),
            )
            .into_response())))
        }
    }
}

fn extract_router_id_and_path<'a>(
    router_id_regex: &Regex,
    path: &'a str,
) -> Result<(RouterId, &'a str), Error> {
    if let Some(captures) = router_id_regex.captures(path) {
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
                    "Path segment matched UUID pattern but failed to parse as \
                     UUID"
                );
                return Err(Error::Internal(InternalError::Internal));
            }
        } else {
            // No UUID matched, so it's a Default Router ID
            router_id = RouterId::Default;
            if let Some(default_path_match) = captures.name("api_path_default")
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

        let mut processed_path_component = extracted_sub_path_component;

        if !processed_path_component.is_empty()
            && !processed_path_component.starts_with('?')
        {
            // This applies to cases like "/foo?bar" or "/?bar"
            // For "/foo?bar", it becomes "/foo"
            // For "/?bar", it becomes "/"
            processed_path_component = processed_path_component
                .split('?')
                .next()
                .unwrap_or(processed_path_component);
        }

        let final_path_and_query_str = if processed_path_component.is_empty() {
            // This case is for when extracted_sub_path_component was originally
            // empty (e.g. /router or /router/UUID)
            "/"
        } else {
            // This handles:
            // - "?query" (from extracted_sub_path_component starting with '?')
            // - "/path" (from stripped "/path?query" or originally "/path")
            // - "/" (from stripped "/?query" or originally "/")
            processed_path_component
        };

        Ok((router_id, final_path_and_query_str))
    } else {
        // Regex did not match the path at all (e.g. path doesn't start with
        // /router)
        Err(Error::InvalidRequest(InvalidRequestError::NotFound(
            path.to_string(),
        )))
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
    #[allow(clippy::too_many_lines)]
    fn test_extract_router_id_and_path() {
        let router_id_regex = Regex::new(ROUTER_ID_REGEX).unwrap();

        let uuid = Uuid::new_v4();

        // UUID with API path
        let path = format!("/router/{uuid}/v1/chat/completions");
        let expected_api_path = "/v1/chat/completions";
        assert_eq!(
            extract_router_id_and_path(&router_id_regex, &path).unwrap(),
            (RouterId::Uuid(uuid), expected_api_path)
        );

        // UUID only (should default to API path "/")
        let path_uuid_only = format!("/router/{uuid}");
        let expected_api_path_uuid_only = "/";
        assert_eq!(
            extract_router_id_and_path(&router_id_regex, &path_uuid_only)
                .unwrap(),
            (RouterId::Uuid(uuid), expected_api_path_uuid_only)
        );

        // UUID with trailing slash (should default to API path "/")
        let path_uuid_trailing_slash = format!("/router/{uuid}/");
        let expected_api_path_uuid_trailing_slash = "/";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                &path_uuid_trailing_slash
            )
            .unwrap(),
            (RouterId::Uuid(uuid), expected_api_path_uuid_trailing_slash)
        );

        // Default with specific API path
        let path_default_specific = "/router/v1/messages";
        let expected_api_path_default_specific = "/v1/messages";
        assert_eq!(
            extract_router_id_and_path(&router_id_regex, path_default_specific)
                .unwrap(),
            (RouterId::Default, expected_api_path_default_specific)
        );

        // Default router root (path "/router")
        let path_default_root = "/router";
        let expected_api_path_default_root = "/";
        assert_eq!(
            extract_router_id_and_path(&router_id_regex, path_default_root)
                .unwrap(),
            (RouterId::Default, expected_api_path_default_root)
        );

        // Default router root with trailing slash (path "/router/")
        let path_default_root_trailing_slash = "/router";
        let expected_api_path_default_root_trailing_slash = "/";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                path_default_root_trailing_slash
            )
            .unwrap(),
            (
                RouterId::Default,
                expected_api_path_default_root_trailing_slash
            )
        );

        // Default with a non-UUID, non-/v1 segment as path
        let path_default_custom_segment = "/router/my-custom-path/data";
        let expected_api_path_custom_segment = "/my-custom-path/data";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                path_default_custom_segment
            )
            .unwrap(),
            (RouterId::Default, expected_api_path_custom_segment)
        );

        // Default with a path that looks like a named ID previously
        let path_prev_named = "/router/my_named_router/v1/completions";
        let expected_api_path_prev_named = "/my_named_router/v1/completions";
        assert_eq!(
            extract_router_id_and_path(&router_id_regex, path_prev_named)
                .unwrap(),
            (RouterId::Default, expected_api_path_prev_named)
        );

        // Invalid path (does not start with /router)
        let path_invalid_base = "/other/invalid/path";
        assert!(matches!(
            extract_router_id_and_path(&router_id_regex, path_invalid_base),
            Err(Error::InvalidRequest(InvalidRequestError::NotFound(_)))
        ));

        // Path that looks like an invalid UUID but is treated as a default path
        // segment
        let path_not_a_uuid_segment = "/router/not-a-uuid/v1/responses";
        let expected_api_path_not_a_uuid = "/not-a-uuid/v1/responses";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                path_not_a_uuid_segment
            )
            .unwrap(),
            (RouterId::Default, expected_api_path_not_a_uuid)
        );

        // --- Cases with Query Parameters ---

        // Default with API path and query
        let path_default_query = "/router/v1/messages?user=test&limit=10";
        let expected_api_path_default_query = "/v1/messages";
        assert_eq!(
            extract_router_id_and_path(&router_id_regex, path_default_query)
                .unwrap(),
            (RouterId::Default, expected_api_path_default_query)
        );

        // UUID with API path and query
        let path_uuid_query = format!("/router/{uuid}/v1/chat?model=gpt4");
        let expected_api_path_uuid_query = "/v1/chat";
        assert_eq!(
            extract_router_id_and_path(&router_id_regex, &path_uuid_query)
                .unwrap(),
            (RouterId::Uuid(uuid), expected_api_path_uuid_query)
        );

        // Default with API path (that used to be "named") and query
        let path_default_custom_query =
            "/router/my_router/v1/endpoint?id=123&flag=true";
        let expected_api_path_default_custom_query = "/my_router/v1/endpoint";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                path_default_custom_query
            )
            .unwrap(),
            (RouterId::Default, expected_api_path_default_custom_query)
        );

        // Default with API path, trailing slash, and query
        let path_default_slash_query = "/router/v1/?action=query";
        let expected_api_path_default_slash_query = "/v1/";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                path_default_slash_query
            )
            .unwrap(),
            (RouterId::Default, expected_api_path_default_slash_query)
        );

        // UUID with API path, trailing slash, and query
        let path_uuid_slash_query = format!("/router/{uuid}/v1/?action=query");
        let expected_api_path_uuid_slash_query = "/v1/";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                &path_uuid_slash_query
            )
            .unwrap(),
            (RouterId::Uuid(uuid), expected_api_path_uuid_slash_query)
        );

        // --- Cases where regex matches but PathAndQuery::try_from might fail
        // --- These paths have query strings but lack a leading '/' for
        // the path component if not part of a longer path.

        // Default router root with only query (e.g. /router?action=query) ->
        // API path "?action=query" (invalid for PathAndQuery)
        let path_default_root_only_query = "/router?action=query";
        let expected_api_path_default_root_only_query = "?action=query";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                path_default_root_only_query
            )
            .unwrap(),
            (RouterId::Default, expected_api_path_default_root_only_query)
        );

        // UUID root with only query (e.g. /router/{uuid}?action=query) -> API
        // path "?action=query" (invalid for PathAndQuery)
        let path_uuid_root_only_query = format!("/router/{uuid}?action=query");
        let expected_api_path_uuid_root_only_query = "?action=query";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                &path_uuid_root_only_query
            )
            .unwrap(),
            (RouterId::Uuid(uuid), expected_api_path_uuid_root_only_query)
        );

        // Default router root with slash and query (e.g. /router/?action=query)
        // -> API path "/"
        let path_default_root_slash_query = "/router/?action=query";
        let expected_path_default_root_slash_query = "/";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                path_default_root_slash_query
            )
            .unwrap(),
            (RouterId::Default, expected_path_default_root_slash_query)
        );

        // UUID root with slash and query (e.g. /router/{uuid}/?action=query) ->
        // API path "/"
        let path_uuid_root_slash_query =
            format!("/router/{uuid}/?action=query");
        let expected_path_uuid_root_slash_query = "/";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                &path_uuid_root_slash_query
            )
            .unwrap(),
            (RouterId::Uuid(uuid), expected_path_uuid_root_slash_query)
        );

        // Default path (that used to be named) with query
        let path_default_was_named_query = "/router/named_id/v1?action=query";
        let expected_path_default_was_named_query = "/named_id/v1";
        assert_eq!(
            extract_router_id_and_path(
                &router_id_regex,
                path_default_was_named_query
            )
            .unwrap(),
            (RouterId::Default, expected_path_default_was_named_query)
        );
    }
}
