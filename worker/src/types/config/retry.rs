use serde::Deserialize;

#[derive(Debug, Deserialize, Eq, Hash, PartialEq)]
pub struct RetryConfig {
    pub enabled: bool,
    pub max_retries: u8,
}
