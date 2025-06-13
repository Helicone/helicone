use http::{HeaderMap, HeaderValue};
use reqwest::ClientBuilder;

use crate::{
    app_state::AppState,
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
        let base_url = app_state
            .0
            .config
            .providers
            .get(&InferenceProvider::OpenAI)
            .ok_or(ProviderError::ProviderNotConfigured(
                InferenceProvider::OpenAI,
            ))?
            .base_url
            .clone();

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
