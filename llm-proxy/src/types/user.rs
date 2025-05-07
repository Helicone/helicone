use derive_more::AsRef;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, AsRef, Clone, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub struct UserId(Uuid);

impl UserId {
    #[must_use]
    pub fn new(id: Uuid) -> Self {
        Self(id)
    }
}
