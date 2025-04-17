use std::sync::Arc;

use http::Request;
use tower_governor::{GovernorError, key_extractor::KeyExtractor};

use crate::types::{request::RequestContext, user::UserId};

#[derive(Debug, Clone)]
pub struct UserIdExtractor;

impl KeyExtractor for UserIdExtractor {
    type Key = UserId;

    fn extract<T>(&self, req: &Request<T>) -> Result<Self::Key, GovernorError> {
        let Some(ctx) = req.extensions().get::<Arc<RequestContext>>().cloned()
        else {
            return Err(GovernorError::UnableToExtractKey);
        };
        Ok(ctx.auth_context.user_id.clone())
    }
}
