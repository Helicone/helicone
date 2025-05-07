pub mod config;
pub mod discover;
pub mod factory;
pub mod monitor;

use crate::types::provider::Provider;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
pub struct Key {
    pub provider: Provider,
}

impl Key {
    pub fn new(provider: Provider) -> Self {
        Self { provider }
    }
}
