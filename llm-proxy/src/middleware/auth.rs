use axum_core::response::IntoResponse;
use futures::future::BoxFuture;
use http::Request;
use tower_http::auth::AsyncAuthorizeRequest;
use tracing::warn;

use crate::{
    app_state::AppState,
    control_plane::types::hash_key,
    error::auth::AuthError,
    types::{extensions::AuthContext, secret::Secret},
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
        let config = &app_state.0.control_plane_state.read().await.config;
        let computed_hash = hash_key(api_key);
        let key = config.get_key_from_hash(&computed_hash);

        if let Some(key) = key {
            Ok(AuthContext {
                api_key: Secret::from(api_key.replace("Bearer ", "")),
                user_id: key.owner_id.as_str().try_into()?,
                org_id: config.auth.organization_id.as_str().try_into()?,
            })
        } else {
            Err(AuthError::InvalidCredentials)
        }
    }
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
        let app_state = self.app_state.clone();
        Box::pin(async move {
            if !app_state.0.config.helicone.enable_auth {
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
