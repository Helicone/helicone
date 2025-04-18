use std::{
    fmt::Display,
    net::{IpAddr, Ipv6Addr},
    path::PathBuf,
    time::Duration,
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields, rename_all = "kebab-case")]
pub struct ServerConfig {
    #[serde(default = "default_address")]
    pub address: IpAddr,
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default)]
    pub tls: TlsConfig,
    #[serde(with = "humantime_serde", default = "default_request_timeout")]
    pub request_timeout: Duration,
    #[serde(with = "humantime_serde", default = "default_shutdown_timeout")]
    pub shutdown_timeout: Duration,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            address: default_address(),
            port: default_port(),
            tls: Default::default(),
            request_timeout: default_request_timeout(),
            shutdown_timeout: default_shutdown_timeout(),
        }
    }
}

fn default_address() -> IpAddr {
    Ipv6Addr::LOCALHOST.into()
}

fn default_port() -> u16 {
    5678
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub enum TlsConfig {
    Enabled { cert: PathBuf, key: PathBuf },
    SelfSigned,
    Disabled,
}

impl Default for TlsConfig {
    fn default() -> Self {
        Self::Disabled
    }
}

impl Display for TlsConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Enabled { .. } => write!(f, "Enabled"),
            Self::SelfSigned => write!(f, "SelfSigned"),
            Self::Disabled => write!(f, "Disabled"),
        }
    }
}

fn default_request_timeout() -> Duration {
    Duration::from_secs(20)
}

fn default_shutdown_timeout() -> Duration {
    Duration::from_secs(30)
}
