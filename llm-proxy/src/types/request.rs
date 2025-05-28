#![allow(dead_code)] // this will be used soon...
use std::sync::Arc;

use axum_core::body::Body;
use chrono::{DateTime, Utc};
use isocountry::CountryCode;
use uuid::Uuid;

use super::{
    model::Model,
    org::OrgId,
    provider::{InferenceProvider, ProviderKeys},
    user::UserId,
};
use crate::config::router::RouterConfig;

pub type Request = http::Request<Body>;

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
    /// If `None`, the router is configured to not require auth for requests,
    /// disabling some features.
    pub auth_context: Option<AuthContext>,
    pub start_time: DateTime<Utc>,
    pub request_id: Uuid,
    pub country_code: CountryCode,
}

#[derive(Debug, Clone)]
pub struct MapperContext {
    pub is_stream: bool,
    /// If `None`, the request was for an endpoint without
    /// first class support for mapping between different provider
    /// models.
    pub model: Option<Model>,
}

#[derive(Debug)]
pub struct RequestProxyContext {
    pub forced_routing: Option<ForcedRouting>,
    pub provider_api_keys: ProviderKeys,
}

#[derive(Debug)]
pub struct ForcedRouting {
    pub provider: InferenceProvider,
    pub model: Model,
}
