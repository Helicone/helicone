use std::time::SystemTime;

use aws_credential_types::Credentials;
use aws_sigv4::{
    http_request::{SignableBody, SignableRequest, SigningSettings},
    sign::v4,
};
use http::{HeaderMap, HeaderValue};
use reqwest::ClientBuilder;

use crate::{
    app_state::AppState,
    error::{
        api::ApiError, init::InitError, internal::InternalError,
        invalid_req::InvalidRequestError, provider::ProviderError,
    },
    types::{
        provider::{InferenceProvider, ProviderKey},
        secret::Secret,
    },
    utils::host_header,
};

#[derive(Debug, Clone, Default)]
pub struct Client {
    pub(super) inner: reqwest::Client,
    pub(super) access_key: Secret<String>,
    pub(super) secret_key: Secret<String>,
}

impl Client {
    pub fn new(
        app_state: &AppState,
        client_builder: ClientBuilder,
        provider_key: &ProviderKey,
    ) -> Result<Self, InitError> {
        let provider_config = app_state
            .0
            .config
            .providers
            .get(&InferenceProvider::Bedrock)
            .ok_or(ProviderError::ProviderNotConfigured(
                InferenceProvider::Bedrock,
            ))?;

        let (access_key, secret_key) = match provider_key {
            ProviderKey::AwsCredentials {
                access_key,
                secret_key,
            } => (access_key, secret_key),
            ProviderKey::Secret(_key) => {
                return Err(InitError::ProviderError(
                    ProviderError::ApiKeyNotFound(InferenceProvider::Bedrock),
                ));
            }
        };

        let base_url = provider_config.base_url.clone();

        let mut default_headers = HeaderMap::new();

        default_headers.insert(http::header::HOST, host_header(&base_url));
        default_headers.insert(
            http::header::CONTENT_TYPE,
            HeaderValue::from_str(mime::APPLICATION_JSON.essence_str())
                .expect("application/json is always a valid header value"),
        );
        let inner = client_builder
            .default_headers(default_headers)
            .build()
            .map_err(InitError::CreateReqwestClient)?;
        Ok(Self {
            inner,
            access_key: access_key.clone(),
            secret_key: secret_key.clone(),
        })
    }

    pub fn extract_and_sign_aws_headers(
        &self,
        mut request_builder: reqwest::RequestBuilder,
        req_body_bytes: &bytes::Bytes,
    ) -> Result<reqwest::RequestBuilder, ApiError> {
        let access_key_id = self.access_key.expose();
        let secret_key = self.secret_key.expose();
        let identity = Credentials::new(
            access_key_id,
            secret_key,
            None,
            None,
            "Environment",
        )
        .into();

        let request = request_builder
            .try_clone()
            .ok_or(InternalError::AwsRequestSigningError(
                "Failed to clone request builder".to_string(),
            ))?
            .body(req_body_bytes.clone())
            .build()
            .map_err(InternalError::from)?;
        let host = request
            .url()
            .host()
            .ok_or(InvalidRequestError::UnsupportedEndpoint(
                "host is required in request url".to_string(),
            ))?
            .to_string();
        let host_region: Vec<&str> = host.split('.').collect();
        let host_region = host_region.get(1).ok_or(
            InvalidRequestError::UnsupportedEndpoint(
                "host is required in request url".to_string(),
            ),
        )?;

        let signing_settings = SigningSettings::default();
        let signing_params = v4::SigningParams::builder()
            .identity(&identity)
            .region(host_region)
            .name("bedrock")
            .time(SystemTime::now())
            .settings(signing_settings)
            .build()
            .map_err(|e| InternalError::AwsRequestSigningError(e.to_string()))?
            .into();

        let mut temp_request = http::Request::builder()
            .uri(request.url().as_str())
            .method(request.method().clone())
            .body(req_body_bytes.clone())
            .map_err(InternalError::from)?;
        temp_request.headers_mut().extend(request.headers().clone());

        let method_str = temp_request.method().to_string();
        let url_str = temp_request.uri().to_string();

        let signable_request = SignableRequest::new(
            method_str.as_str(),
            url_str.as_str(),
            temp_request.headers().iter().filter_map(|(k, v)| {
                if let Ok(v) = v.to_str() {
                    Some((k.as_str(), v))
                } else {
                    None
                }
            }),
            SignableBody::Bytes(req_body_bytes.as_ref()),
        )
        .map_err(|e| InternalError::AwsRequestSigningError(e.to_string()))?;

        let (signing_output, _signature) =
            aws_sigv4::http_request::sign(signable_request, &signing_params)
                .map_err(|e| {
                    InternalError::AwsRequestSigningError(e.to_string())
                })?
                .into_parts();
        signing_output.apply_to_request_http1x(&mut temp_request);

        // Get the headers from the original request
        let req_headers = request.headers();

        // Copy all the aws signed credentials from temp_request since the
        // apply_to_request_http1x is only for http::Request types
        for (key, value) in temp_request.headers() {
            if !req_headers.contains_key(key) {
                request_builder = request_builder.header(key, value);
            }
        }

        Ok(request_builder)
    }
}
