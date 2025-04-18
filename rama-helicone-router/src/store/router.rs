use chrono::{DateTime, Utc};
use sqlx::{Postgres, Transaction};
use uuid::Uuid;

use crate::{error::api::Error, types::router::VersionedRouter};

#[derive(Debug, sqlx::FromRow)]
pub(crate) struct RouterRow {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow)]
pub(crate) struct RouterRowWithVersion {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub version: String,
    pub config: serde_json::Value,
}

#[derive(Debug, Copy, Clone)]
pub struct RouterStore;

impl RouterStore {
    pub async fn get_versioned_router(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        router_version_id: Uuid,
    ) -> Result<VersionedRouter, Error> {
        let row = sqlx::query_as!(
            RouterRowWithVersion,
            r#"SELECT r.id, r.name,
             r.created_at as "created_at: DateTime<Utc>", rv.version, rv.config
            FROM routers r
            JOIN router_versions rv ON r.id = rv.router_id
            WHERE rv.id = $1"#,
            router_version_id
        )
        .fetch_one(&mut **tx)
        .await?;

        VersionedRouter::try_from(row).map_err(Into::into)
    }

    pub async fn get_latest_version(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        router_id: Uuid,
    ) -> Result<VersionedRouter, Error> {
        let row = sqlx::query_as!(
            RouterRowWithVersion,
            r#"SELECT r.id, r.name,
             r.created_at as "created_at: DateTime<Utc>", rv.version, rv.config
            FROM routers r
            JOIN router_versions rv ON r.id = rv.router_id
            WHERE r.id = $1
            ORDER BY rv.created_at DESC
            LIMIT 1"#,
            router_id
        )
        .fetch_one(&mut **tx)
        .await?;

        VersionedRouter::try_from(row).map_err(Into::into)
    }
}
