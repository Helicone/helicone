use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{config::router::RouterConfig, error::internal::InternalError};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RouterId {
    Slug(Uuid),
    Default,
}

#[derive(Debug)]
pub struct RouterMetadata {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

impl From<crate::store::router::RouterRow> for RouterMetadata {
    fn from(row: crate::store::router::RouterRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            created_at: row.created_at,
        }
    }
}

#[derive(Debug)]
pub struct VersionedRouter {
    pub version_id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub version: String,
    pub config: RouterConfig,
}

impl TryFrom<crate::store::router::RouterRowWithVersion> for VersionedRouter {
    type Error = InternalError;

    fn try_from(
        row: crate::store::router::RouterRowWithVersion,
    ) -> Result<Self, Self::Error> {
        let config = serde_json::from_value(row.config).map_err(|e| {
            InternalError::Deserialize {
                ty: "VersionedRouter",
                error: e,
            }
        })?;
        Ok(Self {
            version_id: row.id,
            name: row.name,
            created_at: row.created_at,
            version: row.version,
            config,
        })
    }
}
