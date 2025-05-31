use derive_more::AsRef;
use nonempty_collections::{NEMap, NESet};
use serde::{Deserialize, Serialize};

use crate::types::model_id::ModelName;

const MODEL_MAPPING_YAML: &str =
    include_str!("../../config/model_mapping.yaml");

#[derive(Debug, Clone, Deserialize, Serialize, AsRef, PartialEq, Eq)]
pub struct ModelMappingConfig(
    NEMap<ModelName<'static>, NESet<ModelName<'static>>>,
);

impl Default for ModelMappingConfig {
    #[allow(clippy::too_many_lines)]
    fn default() -> Self {
        serde_yml::from_str(MODEL_MAPPING_YAML)
            .expect("Always valid if tests pass")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_model_mapping_config_loads_from_yaml_string() {
        let _default_config = ModelMappingConfig::default();
        // just want to make sure we don't panic...
    }
}
