pub mod config;
pub mod discover;
pub mod factory;

use crate::{endpoints::EndpointType, types::provider::InferenceProvider};

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
pub struct Key {
    pub provider: InferenceProvider,
    pub endpoint_type: EndpointType,
}

impl Key {
    #[must_use]
    pub fn new(
        provider: InferenceProvider,
        endpoint_type: EndpointType,
    ) -> Self {
        Self {
            provider,
            endpoint_type,
        }
    }
}
