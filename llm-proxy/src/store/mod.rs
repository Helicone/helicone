use provider_keys::ProviderKeyStore;
use sqlx::PgPool;

use self::router::RouterStore;

pub mod provider_keys;
pub mod router;

#[derive(Debug, Clone)]
pub struct StoreRealm {
    pub db: PgPool,
    pub router: RouterStore,
    pub provider_keys: ProviderKeyStore,
}

impl StoreRealm {
    pub fn new(db: PgPool) -> Self {
        Self {
            db,
            router: RouterStore,
            provider_keys: ProviderKeyStore,
        }
    }
}
