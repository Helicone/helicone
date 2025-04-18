use std::str::FromStr;

use http::{Request, Response};
use rama::http::{IntoResponse, layer::auth::AsyncAuthorizeRequest};
use uuid::Uuid;

use crate::{
    app::{AppState, Context},
    error::auth::AuthError,
    types::{org::OrgId, request::AuthContext, user::UserId},
};

#[derive(Clone, Copy)]
pub struct AuthService;

impl AsyncAuthorizeRequest<AppState, rama::http::Body> for AuthService {
    type RequestBody = rama::http::Body;
    type ResponseBody = rama::http::Body;

    #[tracing::instrument(skip_all)]
    fn authorize(
        &self,
        mut ctx: Context,
        request: Request<Self::RequestBody>,
    ) -> impl Future<
        Output = Result<
            (Context, Request<Self::RequestBody>),
            Response<Self::ResponseBody>,
        >,
    > + Send {
        async move {
            let Some(auth_ctx) = check_auth(&request).await else {
                return Err(AuthError::InvalidCredentials.into_response());
            };
            ctx.insert(auth_ctx);

            Ok((ctx, request))
        }
    }
}

async fn check_auth<B>(_request: &Request<B>) -> Option<AuthContext> {
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
