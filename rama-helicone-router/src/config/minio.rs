use std::time::Duration;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    #[serde(default = "default_bucket_name")]
    pub bucket_name: String,
    #[serde(with = "humantime_serde", default = "default_expiry_time")]
    pub expiry_time: Duration,
    /// public base url eg `https://rockstar-minio.fly.dev`
    #[serde(default = "default_host")]
    pub host: url::Url,
    #[serde(default = "default_region")]
    pub region: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            bucket_name: default_bucket_name(),
            // 1 hour
            expiry_time: default_expiry_time(),
            host: default_host(),
            region: default_region(),
        }
    }
}

fn default_bucket_name() -> String {
    "rockstar-images-dev".to_string()
}

fn default_expiry_time() -> Duration {
    Duration::from_secs(3_600)
}

fn default_host() -> url::Url {
    "http://localhost:5532".parse().unwrap()
}

fn default_region() -> String {
    "us-west-1".to_string()
}
