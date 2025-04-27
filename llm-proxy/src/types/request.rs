#![allow(dead_code)] // this will be used soon...
use std::{sync::Arc, time::Instant};

use axum_core::body::Body;
use indexmap::IndexMap;
use isocountry::CountryCode;

use super::{
    model::Model,
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
    pub router_config: Arc<RouterConfig>,
    pub proxy_context: RequestProxyContext,
    pub auth_context: AuthContext,
    pub helicone: HeliconeContext,
    pub is_stream: bool,
    pub start_time: Instant,
    pub request_id: String,
    pub country_code: CountryCode,
}

pub struct RequestProxyContext {
    pub original_provider: Provider,
    pub original_model: Model,
    pub forced_routing: Option<ForcedRouting>,
    pub provider_api_keys: ProviderKeys,
}

pub struct ForcedRouting {
    pub provider: Provider,
    pub model: Model,
}
