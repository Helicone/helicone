use weighted_balance::weight::{HasWeight, Weight};

use crate::types::provider::Provider;

pub mod config;
pub mod discover;
pub mod factory;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
pub struct WeightedKey {
    pub provider: Provider,
    pub weight: Weight,
}

impl WeightedKey {
    pub fn new(provider: Provider, weight: Weight) -> Self {
        Self { provider, weight }
    }
}

impl HasWeight for WeightedKey {
    fn weight(&self) -> Weight {
        self.weight
    }
}
