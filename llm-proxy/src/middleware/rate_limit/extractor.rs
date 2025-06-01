use http::Request;

use super::brakes::{KeyExtractor, KeyExtractorError};
use crate::types::request::AuthContext;

#[derive(Debug, Clone)]
pub struct RateLimitKeyExtractor;

impl KeyExtractor for RateLimitKeyExtractor {
    fn extract<T>(
        &self,
        req: &Request<T>,
    ) -> Result<String, KeyExtractorError> {
        let Some(ctx) = req.extensions().get::<AuthContext>() else {
            return Err(KeyExtractorError::UnableToExtractKey);
        };

        let user_id = ctx.user_id.to_string();
        tracing::info!("user_id: {}", user_id);
        Ok(user_id)
    }
}
