use serde::{Deserialize, Serialize};

#[derive(
    Debug, Default, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize,
)]
#[serde(rename_all = "kebab-case")]
pub enum DiscoverMode {
    /// Discover enabled providers from a YAML config file.
    #[default]
    Config,
}
