use http::{HeaderMap, HeaderValue};
use reqwest::ClientBuilder;

use crate::{
    app_state::AppState,
    error::{init::InitError, provider::ProviderError},
    types::provider::{InferenceProvider, ProviderKey},
    utils::host_header,
};

#[derive(Debug, Clone, Default)]
pub struct Client(pub(super) reqwest::Client);

impl Client {
    pub fn new(
        app_state: &AppState,
        client_builder: ClientBuilder,
        provider_key: &ProviderKey,
    ) -> Result<Self, InitError> {
        let base_url = app_state
            .0
            .config
            .providers
            .get(&InferenceProvider::GoogleGemini)
            .ok_or(ProviderError::ProviderNotConfigured(
                InferenceProvider::GoogleGemini,
            ))?
            .base_url
            .clone();

        let api_key = match provider_key {
            ProviderKey::Secret(key) => key,
            ProviderKey::AwsCredentials { .. } => {
                return Err(InitError::ProviderError(
                    ProviderError::ApiKeyNotFound(
                        InferenceProvider::GoogleGemini,
                    ),
                ));
            }
        };

        let mut default_headers = HeaderMap::new();
        default_headers.insert(
            http::header::AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", api_key.expose()))
                .unwrap(),
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
