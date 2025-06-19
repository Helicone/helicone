use derive_more::AsRef;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::auth::AuthError;

#[derive(
    Debug, AsRef, Copy, Clone, Eq, PartialEq, Hash, Serialize, Deserialize,
)]
pub struct UserId(Uuid);

impl UserId {
    #[must_use]
    pub fn new(id: Uuid) -> Self {
        Self(id)
    }
}

impl std::fmt::Display for UserId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl TryFrom<&str> for UserId {
    type Error = AuthError;
    fn try_from(value: &str) -> Result<Self, Self::Error> {
        Ok(UserId::new(
            Uuid::parse_str(value)
                .map_err(|_| AuthError::InvalidCredentials)?,
        ))
    }
}
