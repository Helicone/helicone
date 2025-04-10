use serde::Deserialize;

use super::{dispatcher::DispatcherConfig, server::ServerConfig};

#[derive(Debug, Default, Deserialize)]
pub struct AppConfig {
    pub dispatcher: DispatcherConfig,
    pub server: ServerConfig,
}
