use std::time::Duration;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub struct RetryConfig {
    pub enabled: bool,
    pub max_retries: u8,
    #[serde(flatten)]
    pub strategy: Strategy,
}

#[derive(Debug, Clone, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case", tag = "strategy")]
pub enum Strategy {
    Exponential {
        #[serde(with = "humantime_serde")]
        base: Duration,
        #[serde(with = "humantime_serde")]
        max: Duration,
    },
}
