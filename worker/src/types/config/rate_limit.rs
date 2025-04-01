use std::time::Duration;

use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct RateLimitConfig {
    pub unauthenticated: LimitConfig,
    pub authenticated: LimitConfig,
}

#[derive(Debug, Deserialize)]
pub struct LimitConfig {
    pub enabled: bool,
    pub period: Duration,
    pub quota_size: u32,
}
