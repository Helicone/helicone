use serde::Deserialize;

use super::{dispatcher::DispatcherConfig, server::ServerConfig};

#[derive(Debug, Default, Deserialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct AppConfig {
    pub dispatcher: DispatcherConfig,
    pub server: ServerConfig,
}
