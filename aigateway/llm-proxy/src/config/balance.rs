use std::collections::HashMap;

use derive_more::{AsRef, From};
use indexmap::IndexSet;
use nonempty_collections::{NESet, nes};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use crate::{endpoints::EndpointType, types::provider::InferenceProvider};

/// A registry of balance configs for each endpoint type,
/// since a separate load balancer is used for each endpoint type.
#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq, AsRef, From)]
pub struct BalanceConfig(pub HashMap<EndpointType, BalanceConfigInner>);

impl Default for BalanceConfig {
    fn default() -> Self {
        Self(HashMap::from([(
            EndpointType::Chat,
            BalanceConfigInner::Latency {
                targets: nes![
                    InferenceProvider::OpenAI,
                    InferenceProvider::Anthropic,
                    InferenceProvider::GoogleGemini,
                ],
            },
        )]))
    }
}

impl BalanceConfig {
    #[cfg(any(test, feature = "testing"))]
    #[must_use]
    pub fn openai_chat() -> Self {
        Self(HashMap::from([(
            EndpointType::Chat,
            BalanceConfigInner::Weighted {
                targets: nes![BalanceTarget {
                    provider: InferenceProvider::OpenAI,
                    weight: Decimal::from(1),
                }],
            },
        )]))
    }

    #[cfg(any(test, feature = "testing"))]
    #[must_use]
    pub fn anthropic_chat() -> Self {
        Self(HashMap::from([(
            EndpointType::Chat,
            BalanceConfigInner::Weighted {
                targets: nes![BalanceTarget {
                    provider: InferenceProvider::Anthropic,
                    weight: Decimal::from(1),
                }],
            },
        )]))
    }

    #[cfg(any(test, feature = "testing"))]
    #[must_use]
    pub fn google_gemini() -> Self {
        Self(HashMap::from([(
            EndpointType::Chat,
            BalanceConfigInner::Weighted {
                targets: nes![BalanceTarget {
                    provider: InferenceProvider::GoogleGemini,
                    weight: Decimal::from(1),
                }],
            },
        )]))
    }

    #[cfg(any(test, feature = "testing"))]
    #[must_use]
    pub fn ollama_chat() -> Self {
        Self(HashMap::from([(
            EndpointType::Chat,
            BalanceConfigInner::Weighted {
                targets: nes![BalanceTarget {
                    provider: InferenceProvider::Ollama,
                    weight: Decimal::from(1),
                }],
            },
        )]))
    }

    #[cfg(any(test, feature = "testing"))]
    #[must_use]
    pub fn bedrock() -> Self {
        Self(HashMap::from([(
            EndpointType::Chat,
            BalanceConfigInner::Weighted {
                targets: nes![BalanceTarget {
                    provider: InferenceProvider::Bedrock,
                    weight: Decimal::from(1),
                }],
            },
        )]))
    }

    #[must_use]
    pub fn providers(&self) -> IndexSet<InferenceProvider> {
        self.0
            .values()
            .flat_map(BalanceConfigInner::providers)
            .collect()
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case", tag = "strategy")]
pub enum BalanceConfigInner {
    Weighted { targets: NESet<BalanceTarget> },
    Latency { targets: NESet<InferenceProvider> },
}

impl BalanceConfigInner {
    #[must_use]
    pub fn providers(&self) -> IndexSet<InferenceProvider> {
        match self {
            Self::Weighted { targets } => {
                targets.iter().map(|t| t.provider).collect()
            }
            Self::Latency { targets } => targets.iter().copied().collect(),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, Hash, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct BalanceTarget {
    pub provider: InferenceProvider,
    pub weight: Decimal,
}
