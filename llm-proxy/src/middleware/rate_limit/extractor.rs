use std::sync::Arc;

use http::Request;
use tower_governor::{GovernorError, key_extractor::KeyExtractor};

use crate::types::request::RequestContext;

#[derive(Clone)]
pub struct UserIdExtractor;

impl KeyExtractor for UserIdExtractor {
    type Key = String;

    fn extract<T>(&self, req: &Request<T>) -> Result<Self::Key, GovernorError> {
        let Some(ctx) = req.extensions().get::<Arc<RequestContext>>().cloned()
        else {
            return Err(GovernorError::UnableToExtractKey);
        };
        Ok(ctx.helicone.user_id.clone())
    }
}
