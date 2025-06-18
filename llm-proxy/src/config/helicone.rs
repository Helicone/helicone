use serde::{Deserialize, Serialize};
use url::Url;

use crate::{types::secret::Secret, utils::default_true};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(default, rename_all = "kebab-case", deny_unknown_fields)]
pub struct HeliconeConfig {
    /// The API key to authenticate the AI Gateway to the Helicone control
    /// plane.
    pub api_key: Secret<String>,
    /// The base URL of Helicone.
    pub base_url: Url,
    /// The websocket URL of the Helicone control plane.
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
            api_key: Secret::from(
                std::env::var("HELICONE_API_KEY")
                    .unwrap_or("sk-helicone-...".to_string()),
            ),
            base_url: "http://localhost:8585".parse().unwrap(),
            websocket_url: "ws://localhost:8585/ws/v1/router/control-plane"
                .parse()
                .unwrap(),
            enable_auth: true,
        }
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for HeliconeConfig {
    fn test_default() -> Self {
        Self::default()
    }
}
