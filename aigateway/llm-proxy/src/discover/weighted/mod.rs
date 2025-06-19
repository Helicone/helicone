use weighted_balance::weight::{HasWeight, Weight};

use crate::{endpoints::EndpointType, types::provider::InferenceProvider};

pub mod factory;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
pub struct WeightedKey {
    pub provider: InferenceProvider,
    pub endpoint_type: EndpointType,
    pub weight: Weight,
}

impl WeightedKey {
    #[must_use]
    pub fn new(
        provider: InferenceProvider,
        endpoint_type: EndpointType,
        weight: Weight,
    ) -> Self {
        Self {
            provider,
            endpoint_type,
            weight,
        }
    }
}

impl HasWeight for WeightedKey {
    fn weight(&self) -> Weight {
        self.weight
    }
}
