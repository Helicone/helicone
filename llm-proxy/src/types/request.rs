#![allow(dead_code)] // this will be used soon...
use std::sync::Arc;

use axum_core::body::Body;
use chrono::{DateTime, Utc};
use indexmap::IndexMap;
use isocountry::CountryCode;
use uuid::Uuid;

use super::{
    model::Model,
    org::OrgId,
    provider::{Provider, ProviderKeys},
    template::TemplateInputs,
    user::UserId,
};
use crate::config::router::RouterConfig;

pub type Request = http::Request<Body>;

#[derive(Debug)]
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

#[derive(Debug)]
pub struct RequestContext {
    pub router_config: Arc<RouterConfig>,
    pub proxy_context: RequestProxyContext,
    pub auth_context: AuthContext,
    pub helicone: HeliconeContext,
    pub is_stream: bool,
    pub start_time: DateTime<Utc>,
    pub request_id: Uuid,
    pub country_code: CountryCode,
}

#[derive(Debug)]
pub struct RequestProxyContext {
    pub forced_routing: Option<ForcedRouting>,
    pub provider_api_keys: ProviderKeys,
}

#[derive(Debug)]
pub struct ForcedRouting {
    pub provider: Provider,
    pub model: Model,
}
