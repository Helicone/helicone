pub mod anthropic;
pub mod mappings;
pub mod openai;

pub trait Endpoint {
    const PATH: &'static str;
    type RequestBody;
    type ResponseBody;
}

use std::str::FromStr;

use bytes::Bytes;
use http::uri::PathAndQuery;

use crate::{
    endpoints::{anthropic::Anthropic, openai::OpenAI},
    error::{
        api::Error, internal::InternalError, invalid_req::InvalidRequestError,
    },
    middleware::mapper::registry::EndpointConverterRegistry,
    types::provider::InferenceProvider,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ApiEndpoint {
    OpenAI(OpenAI),
    Anthropic(Anthropic),
}

impl ApiEndpoint {
    pub fn new(
        path: &PathAndQuery,
        request_style: InferenceProvider,
    ) -> Result<Self, InvalidRequestError> {
        match request_style {
            InferenceProvider::OpenAI => {
                Ok(Self::OpenAI(OpenAI::try_from(path)?))
            }
            InferenceProvider::Anthropic => {
                Ok(Self::Anthropic(Anthropic::try_from(path)?))
            }
            unsupported => {
                tracing::warn!(provider = %unsupported, "Unsupported provider");
                Err(InvalidRequestError::UnsupportedProvider(unsupported))
            }
        }
    }

    pub fn mapped(
        source_endpoint: ApiEndpoint,
        target_provider: InferenceProvider,
    ) -> Result<Self, InvalidRequestError> {
        match (source_endpoint, target_provider) {
            (Self::OpenAI(source), InferenceProvider::Anthropic) => {
                Ok(Self::Anthropic(Anthropic::from(source)))
            }
            (Self::Anthropic(source), InferenceProvider::OpenAI) => {
                Ok(Self::OpenAI(OpenAI::from(source)))
            }
            _ => Err(InvalidRequestError::UnsupportedProvider(target_provider)),
        }
    }

    pub fn map(
        &self,
        converter_registry: &EndpointConverterRegistry,
        body: &Bytes,
        path_and_query: &PathAndQuery,
        target_endpoint: ApiEndpoint,
    ) -> Result<(Bytes, PathAndQuery), Error> {
        let target_path_and_query =
            if let Some(query_params) = path_and_query.query() {
                format!("{}?{}", target_endpoint.path(), query_params)
            } else {
                target_endpoint.path().to_string()
            };
        let target_path_and_query =
            PathAndQuery::from_str(&target_path_and_query)
                .map_err(InternalError::InvalidUri)?;

        let converter = converter_registry
            .get_converter(self, &target_endpoint)
            .ok_or_else(|| {
                InternalError::InvalidConverter(*self, target_endpoint)
            })?;

        let bytes = converter.convert(body)?;
        Ok((bytes, target_path_and_query))
    }

    #[must_use]
    pub fn provider(&self) -> InferenceProvider {
        match self {
            Self::OpenAI(_) => InferenceProvider::OpenAI,
            Self::Anthropic(_) => InferenceProvider::Anthropic,
        }
    }

    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::OpenAI(openai) => openai.path(),
            Self::Anthropic(anthropic) => anthropic.path(),
        }
    }
}
