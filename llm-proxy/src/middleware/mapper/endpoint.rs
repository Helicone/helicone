use std::str::FromStr;

use bytes::Bytes;
use http::uri::PathAndQuery;

use crate::{
    app::AppState,
    error::{
        api::Error, internal::InternalError, invalid_req::InvalidRequestError,
    },
    middleware::mapper::{
        TryConvert, anthropic::AnthropicConverter, openai::OpenAiConverter,
    },
    types::provider::Provider,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ApiEndpoint {
    OpenAI(OpenAI),
    Anthropic(Anthropic),
}

impl ApiEndpoint {
    /// Given a path and query (which could've been for *ANY* provider), return
    /// the corresponding endpoint for the target provider
    pub fn new(
        path: &PathAndQuery,
        provider: Provider,
    ) -> Result<Self, InvalidRequestError> {
        match provider {
            Provider::OpenAI => Ok(Self::OpenAI(OpenAI::try_from(path)?)),
            Provider::Anthropic => {
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
        target_provider: Provider,
    ) -> Result<Self, InvalidRequestError> {
        match (source_endpoint, target_provider) {
            (Self::OpenAI(source), Provider::Anthropic) => {
                Ok(Self::Anthropic(Anthropic::from(source)))
            }
            (Self::Anthropic(source), Provider::OpenAI) => {
                Ok(Self::OpenAI(OpenAI::from(source)))
            }
            _ => Err(InvalidRequestError::UnsupportedProvider(target_provider)),
        }
    }

    pub fn map(
        &self,
        app_state: &AppState,
        body: &Bytes,
        path_and_query: &PathAndQuery,
        target_endpoint: ApiEndpoint,
    ) -> Result<(Bytes, PathAndQuery), Error> {
        let model_mapper = &app_state.0.model_mapper;
        let target_path_and_query = if let Some(query_params) = path_and_query.query() {
            format!("{}?{}", target_endpoint.path(), query_params)
        } else {
            target_endpoint.path().to_string()
        };
        let target_path_and_query = PathAndQuery::from_str(&target_path_and_query).map_err(InternalError::InvalidUri)?;
        let (body, target_path_and_query) = match (self, target_endpoint) {
            (ApiEndpoint::OpenAI(source), ApiEndpoint::Anthropic(target)) => {
                tracing::trace!(source = ?source, target = ?target, "mapping request body");
                let converter = OpenAiConverter::new(model_mapper);
                match (source, target) {
                    (OpenAI::ChatCompletions, Anthropic::Messages) => {
                        let body = serde_json::from_slice::<
                            openai_types::chat::ChatCompletionRequest,
                        >(&body)
                        .map_err(InvalidRequestError::InvalidRequestBody)?;
                        let anthropic_req: anthropic_types::chat::ChatCompletionRequest =
                        converter.try_convert(body)
                            .map_err(InternalError::MapperError)?;
                        let anthropic_req_bytes = serde_json::to_vec(
                            &anthropic_req,
                        )
                        .map_err(|e| InternalError::Serialize {
                            ty: "anthropic_types::chat::ChatCompletionRequest",
                            error: e,
                        })?;
                        let body = Bytes::from(anthropic_req_bytes);
                        (body, target_path_and_query)
                    }
                    _ => {
                        todo!(
                            "Currently only /v1/chat/completions is supported \
                             for openai"
                        )
                    }
                }
            }
            (ApiEndpoint::Anthropic(source), ApiEndpoint::OpenAI(target)) => {
                tracing::trace!(source = ?source, target = ?target, "mapping request body");
                let converter = AnthropicConverter::new(model_mapper);
                match (source, target) {
                    (Anthropic::Messages, OpenAI::ChatCompletions) => {
                        let body = serde_json::from_slice::<
                            anthropic_types::chat::ChatCompletionRequest,
                        >(&body)
                        .map_err(InvalidRequestError::InvalidRequestBody)?;
                        let openai_req: openai_types::chat::ChatCompletionRequest =
                        converter.try_convert(body)
                            .map_err(InternalError::MapperError)?;
                        let openai_req_bytes = serde_json::to_vec(&openai_req)
                            .map_err(|e| {
                                InternalError::Serialize {
                            ty: "anthropic_types::chat::ChatCompletionRequest",
                            error: e,
                        }
                            })?;
                        let body = Bytes::from(openai_req_bytes);
                        (body, target_path_and_query)
                    }
                    _ => {
                        todo!(
                            "Currently only /v1/chat/completions is supported \
                             for openai at the moment"
                        )
                    }
                }
            }
            _ => {
                todo!(
                    "only mapping between openai and anthropic is supported \
                     at the moment"
                )
            }
        };

        Ok((body, target_path_and_query))
    }

    pub fn provider(&self) -> Provider {
        match self {
            Self::OpenAI(_) => Provider::OpenAI,
            Self::Anthropic(_) => Provider::Anthropic,
        }
    }

    pub fn path(&self) -> &str {
        match self {
            Self::OpenAI(openai) => openai.path(),
            Self::Anthropic(anthropic) => anthropic.path(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum OpenAI {
    ChatCompletions,
    Responses,
    LegacyCompletions,
}

impl OpenAI {
    pub fn path(&self) -> &str {
        match self {
            Self::ChatCompletions => "/v1/chat/completions",
            Self::LegacyCompletions => "/v1/completions",
            Self::Responses => "/v1/responses",
        }
    }
}

/// Converts a path and query (for *ANY* provider) to an openai endpoint
impl TryFrom<&PathAndQuery> for OpenAI {
    type Error = InvalidRequestError;

    fn try_from(value: &PathAndQuery) -> Result<Self, Self::Error> {
        tracing::debug!(value = ?value.path(), "trying to convert path and query to openai");
        match value.path() {
            // openai URLs
            "/v1/chat/completions" => Ok(Self::ChatCompletions),
            "/v1/completions" => Ok(Self::LegacyCompletions),
            // anthropic URLs
            "/v1/messages" => Ok(Self::ChatCompletions),
            "/v1/complete" => Ok(Self::LegacyCompletions),
            path => {
                tracing::warn!(path = %path, "unsupported openai path");
                Err(InvalidRequestError::NotFound(path.to_string()))
            }
        }
    }
}

impl From<Anthropic> for OpenAI {
    fn from(value: Anthropic) -> Self {
        match value {
            Anthropic::Messages => Self::ChatCompletions,
            Anthropic::LegacyCompletions => Self::LegacyCompletions,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Anthropic {
    Messages,
    LegacyCompletions,
}

impl Anthropic {
    pub fn path(&self) -> &str {
        match self {
            Self::Messages => "/v1/messages",
            Self::LegacyCompletions => "/v1/complete",
        }
    }
}

/// Converts a path and query (for *ANY* provider) to an anthropic endpoint
impl TryFrom<&PathAndQuery> for Anthropic {
    type Error = InvalidRequestError;

    fn try_from(value: &PathAndQuery) -> Result<Self, Self::Error> {
        tracing::debug!(value = ?value.path(), "trying to convert path and query to anthropic");
        match value.path() {
            // anthropic URLs
            "/v1/messages" => Ok(Self::Messages),
            "/v1/complete" => Ok(Self::LegacyCompletions),
            // openai URLs
            "/v1/chat/completions" => Ok(Self::Messages),
            "/v1/completions" => Ok(Self::LegacyCompletions),
            path => {
                tracing::warn!(path = %path, "unsupported anthropic path");
                Err(InvalidRequestError::NotFound(path.to_string()))
            }
        }
    }
}

impl From<OpenAI> for Anthropic {
    fn from(value: OpenAI) -> Self {
        match value {
            OpenAI::ChatCompletions => Self::Messages,
            OpenAI::Responses => Self::Messages,
            OpenAI::LegacyCompletions => Self::LegacyCompletions,
        }
    }
}
