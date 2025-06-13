use http::{HeaderMap, HeaderName, HeaderValue};
use reqwest::ClientBuilder;

use crate::{
    app_state::AppState,
    config::providers::DEFAULT_ANTHROPIC_VERSION,
    error::{init::InitError, provider::ProviderError},
    types::{provider::InferenceProvider, secret::Secret},
    utils::host_header,
};

#[derive(Debug, Clone, Default)]
pub struct Client(pub(super) reqwest::Client);

impl Client {
    pub fn new(
        app_state: &AppState,
        client_builder: ClientBuilder,
        api_key: &Secret<String>,
    ) -> Result<Self, InitError> {
        let provider_config = app_state
            .0
            .config
            .providers
            .get(&InferenceProvider::Anthropic)
            .ok_or(ProviderError::ProviderNotConfigured(
                InferenceProvider::Anthropic,
            ))?;

        let base_url = provider_config.base_url.clone();
        let version = provider_config
            .version
            .as_deref()
            .unwrap_or(DEFAULT_ANTHROPIC_VERSION);

        let mut default_headers = HeaderMap::new();
        default_headers.insert(
            HeaderName::from_static("x-api-key"),
            HeaderValue::from_str(api_key.expose()).unwrap(),
        );
        default_headers.insert(
            HeaderName::from_static("anthropic-version"),
            HeaderValue::from_str(version).unwrap(),
        );
        default_headers.insert(http::header::HOST, host_header(&base_url));
        default_headers.insert(
            http::header::CONTENT_TYPE,
            HeaderValue::from_str(mime::APPLICATION_JSON.essence_str())
                .unwrap(),
        );

        let inner = client_builder
            .default_headers(default_headers)
            .build()
            .map_err(InitError::CreateReqwestClient)?;
        Ok(Self(inner))
    }
}
