use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub struct Model {
    pub name: String,
    pub version: ModelVersion,
}

#[derive(Debug, Clone, Deserialize, Eq, Hash, PartialEq, Serialize)]
pub enum ModelVersion {
    Latest,
    ReleaseDate(String),
}
