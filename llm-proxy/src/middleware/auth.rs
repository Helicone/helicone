use axum_core::response::IntoResponse;
use futures::future::BoxFuture;
use http::Request;
use serde::Deserialize;
use tower_http::auth::AsyncAuthorizeRequest;
use tracing::warn;
use url::Url;
use uuid::Uuid;

use crate::{
    app::AppState,
    error::auth::AuthError,
    types::{org::OrgId, request::AuthContext, user::UserId},
};

#[derive(Clone)]
pub struct AuthService {
    app_state: AppState,
}

impl AuthService {
    #[must_use]
    pub fn new(app_state: AppState) -> Self {
        Self { app_state }
    }

    async fn authenticate_request_inner(
        app_state: AppState,
        api_key: &str,
    ) -> Result<AuthContext, AuthError> {
        let whoami_result = app_state
            .0
            .jawn_client
            .get(whoami_url(&app_state))
            .header("authorization", api_key)
            .send()
            .await?
            .error_for_status()
            .map_err(AuthError::UnsuccessfulAuthResponse)?;
        let body = whoami_result.json::<WhoamiResponse>().await?;
        Ok(AuthContext {
            api_key: api_key.replace("Bearer ", ""),
            user_id: UserId::new(body.user_id),
            org_id: OrgId::new(body.organization_id),
        })
    }
}

#[derive(Debug, Deserialize)]
struct WhoamiResponse {
    #[serde(rename = "userId")]
    user_id: Uuid,
    #[serde(rename = "organizationId")]
    organization_id: Uuid,
}

impl<B> AsyncAuthorizeRequest<B> for AuthService
where
    B: Send + 'static,
{
    type RequestBody = B;
    type ResponseBody = axum_core::body::Body;
    type Future = BoxFuture<
        'static,
        Result<Request<B>, http::Response<Self::ResponseBody>>,
    >;

    #[tracing::instrument(skip_all)]
    fn authorize(&mut self, mut request: Request<B>) -> Self::Future {
        // NOTE:
        // this is a temporary solution, when we get the control plane up and
        // running, we will actively be validating the helicone api keys
        // at the router rather than authenticating with jawn each time
        let app_state = self.app_state.clone();
        Box::pin(async move {
            if !app_state.0.config.auth.require_auth {
                tracing::trace!("Auth middleware: auth disabled");
                return Ok(request);
            }
            tracing::trace!("Auth middleware");
            let Some(api_key) = request
                .headers()
                .get("authorization")
                .and_then(|h| h.to_str().ok())
            else {
                return Err(
                    AuthError::MissingAuthorizationHeader.into_response()
                );
            };
            app_state.0.metrics.auth_attempts.add(1, &[]);
            match Self::authenticate_request_inner(app_state.clone(), api_key)
                .await
            {
                Ok(auth_ctx) => {
                    request.extensions_mut().insert(auth_ctx);
                    Ok(request)
                }
                Err(e) => {
                    match &e {
                        AuthError::Transport(_) => {
                            warn!(error = %e, "Authentication error");
                        }
                        AuthError::UnsuccessfulAuthResponse(_)
                        | AuthError::MissingAuthorizationHeader
                        | AuthError::InvalidCredentials => {
                            app_state.0.metrics.auth_rejections.add(1, &[]);
                        }
                    }
                    Err(e.into_response())
                }
            }
        })
    }
}

fn whoami_url(app_state: &AppState) -> Url {
    app_state
        .0
        .config
        .helicone
        .base_url
        .join("/v1/router/control-plane/whoami")
        .expect("helicone base url should be valid")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{app::App, config::Config, tests::TestDefault};

    #[tokio::test]
    async fn test_whoami_url() {
        let app = App::new(Config::test_default()).await.unwrap();
        let _whoami_url = whoami_url(&app.state);
        // we don't care to assert what the url is,
        // we just want to make sure it's not panicking
    }
}
