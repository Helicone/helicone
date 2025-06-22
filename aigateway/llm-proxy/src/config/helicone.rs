use serde::{Deserialize, Serialize};
use url::Url;

use crate::{types::secret::Secret, utils::default_true};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case", deny_unknown_fields)]
pub struct HeliconeConfig {
    /// The API key to authenticate the AI Gateway to the Helicone control
    /// plane.
    #[serde(default = "default_api_key")]
    pub api_key: Secret<String>,
    /// The base URL of Helicone.
    #[serde(default = "default_base_url")]
    pub base_url: Url,
    /// The websocket URL of the Helicone control plane.
    #[serde(default = "default_websocket_url")]
    pub websocket_url: Url,
    /// Whether to enable authentication.
    ///
    /// **Note**: without this enabled, anyone sending requests to your
    /// AI gateway instance will be able to use your provider API keys!
    #[serde(default = "default_true")]
    pub enable_auth: bool,
}

impl Default for HeliconeConfig {
    fn default() -> Self {
        Self {
            api_key: default_api_key(),
            base_url: default_base_url(),
            websocket_url: default_websocket_url(),
            enable_auth: true,
        }
    }
}

fn default_api_key() -> Secret<String> {
    Secret::from(
        std::env::var("HELICONE_API_KEY")
            .unwrap_or("sk-helicone-...".to_string()),
    )
}

fn default_base_url() -> Url {
    "http://localhost:8585".parse().unwrap()
}

fn default_websocket_url() -> Url {
    "ws://localhost:8585/ws/v1/router/control-plane"
        .parse()
        .unwrap()
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for HeliconeConfig {
    fn test_default() -> Self {
        Self::default()
    }
}
