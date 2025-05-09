use weighted_balance::weight::{HasWeight, Weight};

use crate::types::provider::InferenceProvider;

pub mod factory;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
pub struct WeightedKey {
    pub provider: InferenceProvider,
    pub weight: Weight,
}

impl WeightedKey {
    pub fn new(provider: InferenceProvider, weight: Weight) -> Self {
        Self { provider, weight }
    }
}

impl HasWeight for WeightedKey {
    fn weight(&self) -> Weight {
        self.weight
    }
}
