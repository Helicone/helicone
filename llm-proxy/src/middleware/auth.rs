use std::str::FromStr;

use futures::future::BoxFuture;
use http::{Request, StatusCode};
use tower_http::auth::AsyncAuthorizeRequest;
use uuid::Uuid;

use crate::types::{org::OrgId, request::AuthContext, user::UserId};

#[derive(Clone, Copy)]
pub struct AuthService;

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

    #[tracing::instrument(name = "AuthService::authorize", skip(self, request))]
    fn authorize(&mut self, mut request: Request<B>) -> Self::Future {
        tracing::trace!("AuthService::authorize");
        Box::pin(async move {
            if let Some(auth_ctx) = check_auth(&request) {
                // Set `auth_ctx` as a request extension so it can be accessed
                // by other services down the stack.
                request.extensions_mut().insert(auth_ctx);

                Ok(request)
            } else {
                let unauthorized_response = http::Response::builder()
                    .status(StatusCode::UNAUTHORIZED)
                    .body(axum_core::body::Body::default())
                    .unwrap();

                Err(unauthorized_response)
            }
        })
    }
}

fn check_auth<B>(_request: &Request<B>) -> Option<AuthContext> {
    // ...
    // for now we are mocking this just to show how layers will stack on top of
    // each other

    // test@helicone.ai / org for test
    let org_id =
        Uuid::from_str("83635a30-5ba6-41a8-8cc6-fb7df941b24a").unwrap();
    let user_id =
        Uuid::from_str("f76629c5-a070-4bbc-9918-64beaea48848").unwrap();
    // change to run locally while this is hardcoded
    let api_key = "sk-helicone-wvdmyza-57wu7ii-rr3csyi-tox7nqy".to_string();
    Some(AuthContext {
        api_key,
        user_id: UserId::new(user_id),
        org_id: OrgId::new(org_id),
    })
}
