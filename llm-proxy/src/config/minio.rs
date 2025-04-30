use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    #[serde(default = "default_bucket_name")]
    pub bucket_name: String,
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default = "default_region")]
    pub region: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            bucket_name: default_bucket_name(),
            host: default_host(),
            region: default_region(),
        }
    }
}

fn default_bucket_name() -> String {
    "request-response-storage".to_string()
}

fn default_host() -> String {
    "localhost:9000".to_string()
}

fn default_region() -> String {
    "us-west-1".to_string()
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for Config {
    fn test_default() -> Self {
        Self::default()
    }
}
