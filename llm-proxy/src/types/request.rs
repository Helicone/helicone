use std::time::Instant;

use indexmap::IndexMap;
use isocountry::CountryCode;
use reqwest::Body;
use url::Url;

use super::{
    org::OrgId,
    provider::{Provider, ProviderKeys},
    template::TemplateInputs,
    user::UserId,
};
use crate::config::router::RouterConfig;

pub type Request = http::Request<Body>;

pub struct HeliconeContext {
    pub properties: Option<IndexMap<String, String>>,
    pub template_inputs: Option<TemplateInputs>,
}

#[derive(Debug, Clone)]
pub struct AuthContext {
    pub api_key: String,
    pub user_id: UserId,
    pub org_id: OrgId,
}

pub struct RequestContext {
    pub router_config: RouterConfig,
    pub proxy_context: RequestProxyContext,
    pub auth_context: AuthContext,
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
    pub provider_api_keys: ProviderKeys,
}
