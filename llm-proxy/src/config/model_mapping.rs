use derive_more::AsRef;
use nonempty_collections::{NEMap, NESet, nem, nes};
use serde::{Deserialize, Serialize};

use crate::types::model::ModelName;

#[derive(Debug, Clone, Deserialize, Serialize, AsRef, PartialEq, Eq)]
pub struct ModelMappingConfig(
    NEMap<ModelName<'static>, NESet<ModelName<'static>>>,
);

impl Default for ModelMappingConfig {
    #[allow(clippy::too_many_lines)]
    fn default() -> Self {
        ModelMappingConfig(nem![
            ModelName::borrowed("gpt-4o-mini") => nes![
                ModelName::borrowed("claude-3-5-haiku"),
                ModelName::borrowed("gemini-2.0-flash")
            ],
            ModelName::borrowed("gpt-4o") => nes![
                ModelName::borrowed("claude-3-5-sonnet"),
                ModelName::borrowed("gemini-2.0-flash")
            ],
            ModelName::borrowed("gpt-4.1") => nes![
                ModelName::borrowed("claude-3-7-sonnet"),
                ModelName::borrowed("gemini-2.0-flash")
            ],
            ModelName::borrowed("gpt-4.5") => nes![
                ModelName::borrowed("claude-3-7-sonnet"),
                ModelName::borrowed("gemini-2.0-flash")
            ],
            ModelName::borrowed("o3") => nes![
                ModelName::borrowed("claude-3-7-sonnet"),
                ModelName::borrowed("gemini-2.0-flash")
            ],
            ModelName::borrowed("o4-mini") => nes![
                ModelName::borrowed("claude-3-5-sonnet"),
                ModelName::borrowed("gemini-2.0-flash")
            ],
            ModelName::borrowed("o4-mini-high") => nes![
                ModelName::borrowed("claude-3-5-sonnet"),
                ModelName::borrowed("gemini-2.0-flash")
            ],

            ModelName::borrowed("claude-3-5-haiku") => nes![ModelName::borrowed("gpt-4o-mini")],
            ModelName::borrowed("claude-3-5-sonnet") => nes![ModelName::borrowed("gpt-4o")],
            ModelName::borrowed("claude-3-7-sonnet") => nes![ModelName::borrowed("gpt-4.1")],
        ])
    }
}
