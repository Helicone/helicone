use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{config::router::RouterConfig, error::internal::InternalError};

#[derive(
    Debug, Copy, Clone, PartialEq, Eq, Hash, Serialize, Deserialize, Default,
)]
pub enum RouterId {
    Uuid(Uuid),
    #[default]
    Default,
}

impl std::fmt::Display for RouterId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RouterId::Uuid(uuid) => write!(f, "{uuid}"),
            RouterId::Default => write!(f, "default"),
        }
    }
}

#[derive(Debug)]
#[allow(dead_code)]
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

#[cfg(test)]
mod tests {
    use http::uri::PathAndQuery;

    use super::*;

    #[test]
    fn router_id_round_trip() {
        let id = RouterId::Uuid(Uuid::new_v4());
        let serialized = serde_json::to_string(&id).unwrap();
        let deserialized =
            serde_json::from_str::<RouterId>(&serialized).unwrap();
        assert_eq!(id, deserialized);

        let id = RouterId::Default;
        let serialized = serde_json::to_string(&id).unwrap();
        let deserialized =
            serde_json::from_str::<RouterId>(&serialized).unwrap();
        assert_eq!(id, deserialized);
    }

    #[test]
    fn extracted_path_and_query_try_from_str() {
        let path_and_query =
            PathAndQuery::try_from("/v1/chat/completions").unwrap();
        assert_eq!(path_and_query.as_str(), "/v1/chat/completions");
        let path_and_query =
            PathAndQuery::try_from("/v1/chat/completions?key=value").unwrap();
        assert_eq!(path_and_query.as_str(), "/v1/chat/completions?key=value");
    }
}
