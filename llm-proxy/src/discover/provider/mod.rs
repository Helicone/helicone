pub mod config;
pub mod discover;
pub mod factory;
pub mod monitor;

use crate::types::provider::InferenceProvider;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
pub struct Key {
    pub provider: InferenceProvider,
}

impl Key {
    pub fn new(provider: InferenceProvider) -> Self {
        Self { provider }
    }
}
