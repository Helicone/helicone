use std::time::Instant;

use indexmap::IndexMap;
use isocountry::CountryCode;
use serde::Deserialize;
use url::Url;

use super::config::{router::RouterConfig, template::TemplateInputs};

#[derive(Debug, Clone, Copy, Deserialize, Eq, Hash, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum Provider {
    OpenAI,
    Anthropic,
}

pub struct HeliconeContext {
    pub api_key: String,
    pub user_id: String,
    pub properties: Option<IndexMap<String, String>>,
    pub template_inputs: Option<TemplateInputs>,
}

pub struct RequestContext {
    pub router_config: RouterConfig,
    pub proxy_context: RequestProxyContext,
    pub helicone: HeliconeContext,
    pub is_stream: bool,
    pub start_time: Instant,
    pub request_id: String,
    pub country_code: CountryCode,
}

pub struct RequestProxyContext {
    pub target_url: Url,
    pub target_provider: Provider,
    pub original_provider: Provider,
    pub provider_api_key: String,
}
