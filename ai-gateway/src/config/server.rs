use std::{
    fmt::Display,
    net::{IpAddr, Ipv4Addr},
    path::PathBuf,
    time::Duration,
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct ServerConfig {
    #[serde(default = "default_address")]
    pub address: IpAddr,
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default)]
    pub tls: TlsConfig,
    #[serde(with = "humantime_serde", default = "default_shutdown_timeout")]
    pub shutdown_timeout: Duration,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            address: default_address(),
            port: default_port(),
            tls: TlsConfig::default(),
            shutdown_timeout: default_shutdown_timeout(),
        }
    }
}

fn default_address() -> IpAddr {
    Ipv4Addr::LOCALHOST.into()
}

fn default_port() -> u16 {
    8080
}

#[derive(Default, Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub enum TlsConfig {
    Enabled {
        cert: PathBuf,
        key: PathBuf,
    },
    #[default]
    Disabled,
}

impl Display for TlsConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Enabled { .. } => write!(f, "Enabled"),
            Self::Disabled => write!(f, "Disabled"),
        }
    }
}

fn default_shutdown_timeout() -> Duration {
    Duration::from_secs(30)
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for ServerConfig {
    fn test_default() -> Self {
        Self::default()
    }
}
