use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    #[default]
    Compact,
    Pretty,
    Json,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default, deny_unknown_fields)]
pub struct Config {
    pub format: Format,
    pub level: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            format: Format::Pretty,
            level: "info,llm_proxy=trace,hyper=error,tonic=error,h2=error,\
                    reqwest=error"
                .to_string(),
        }
    }
}
