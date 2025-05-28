use derive_more::AsRef;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(
    Debug, AsRef, Copy, Clone, Eq, PartialEq, Hash, Serialize, Deserialize,
)]
pub struct OrgId(Uuid);

impl OrgId {
    #[must_use]
    pub fn new(id: Uuid) -> Self {
        Self(id)
    }
}

impl std::fmt::Display for OrgId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
