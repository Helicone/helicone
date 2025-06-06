use http::Request;
use tower_governor::{GovernorError, key_extractor::KeyExtractor};

use crate::types::{request::AuthContext, user::UserId};

#[derive(Debug, Clone)]
pub struct RateLimitKeyExtractor;

impl KeyExtractor for RateLimitKeyExtractor {
    type Key = UserId;
    fn extract<T>(&self, req: &Request<T>) -> Result<Self::Key, GovernorError> {
        let Some(ctx) = req.extensions().get::<AuthContext>() else {
            return Err(GovernorError::UnableToExtractKey);
        };

        Ok(ctx.user_id)
    }
}
