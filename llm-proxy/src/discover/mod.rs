pub mod config;

use crate::types::{model::Model, provider::Provider};

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
pub struct Key {
    pub model: Model,
    pub provider: Provider,
}

impl Key {
    pub fn new(model: Model, provider: Provider) -> Self {
        Self { model, provider }
    }
}
