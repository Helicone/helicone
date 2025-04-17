use sqlx::{Postgres, Transaction};
use uuid::Uuid;

use crate::{
    error::api::Error,
    types::{org::OrgId, provider::Provider, secret::Secret},
};

#[derive(Debug, sqlx::FromRow)]
pub struct ProviderKeyRow {
    pub id: Uuid,
    pub org_id: Uuid,
    pub provider_name: String,
    pub provider_key: Secret<String>,
}

#[derive(Debug, Copy, Clone)]
pub struct ProviderKeyStore;

impl ProviderKeyStore {
    // TODO: we need to link the provider key to the router config
    pub async fn get_provider_key(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        org_id: &OrgId,
        provider: Provider,
    ) -> Result<ProviderKeyRow, Error> {
        // not sure how derive_more serializes it tbh
        tracing::info!("serialized provider: {}", provider.to_string());

        // TODO: the decrypted_ view doesn't inherit the same constraints,
        // we should fix in helicone repo side and remove the `!`
        let row = sqlx::query_as!(
            ProviderKeyRow,
            r#"
            SELECT
                id                     AS "id!: Uuid",
                org_id                 AS "org_id!: Uuid",
                provider_name          AS "provider_name!: String",
                decrypted_provider_key AS "provider_key!: Secret<String>"
            FROM decrypted_provider_keys
            WHERE org_id = $1
              AND provider_name = $2
            LIMIT 1
            "#,
            org_id.as_ref(),
            provider.to_string(),
        )
        .fetch_one(&mut **tx)
        .await?;

        Ok(row)
    }
}
