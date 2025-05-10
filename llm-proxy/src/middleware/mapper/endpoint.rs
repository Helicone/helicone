use std::str::FromStr;

use bytes::Bytes;
use http::uri::PathAndQuery;

use crate::{
    app::AppState,
    config::router::RouterConfig,
    error::{
        api::Error, internal::InternalError, invalid_req::InvalidRequestError,
    },
    middleware::mapper::{
        TryConvert, anthropic::AnthropicConverter, model::ModelMapper,
        openai::OpenAiConverter,
    },
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
        app_state: &AppState,
        router_config: &RouterConfig,
        body: &Bytes,
        path_and_query: &PathAndQuery,
        target_endpoint: ApiEndpoint,
    ) -> Result<(Bytes, PathAndQuery), Error> {
        let model_mapper = ModelMapper::new(app_state, router_config);
        let target_path_and_query =
            if let Some(query_params) = path_and_query.query() {
                format!("{}?{}", target_endpoint.path(), query_params)
            } else {
                target_endpoint.path().to_string()
            };
        let target_path_and_query =
            PathAndQuery::from_str(&target_path_and_query)
                .map_err(InternalError::InvalidUri)?;
        let (body, target_path_and_query) = match (self, target_endpoint) {
            (ApiEndpoint::OpenAI(source), ApiEndpoint::Anthropic(target)) => {
                let converter = OpenAiConverter::new(&model_mapper);
                if let (OpenAI::ChatCompletions, Anthropic::Messages) =
                    (source, target)
                {
                    let body = serde_json::from_slice::<
                        openai_types::chat::ChatCompletionRequest,
                    >(body)
                    .map_err(InvalidRequestError::InvalidRequestBody)?;
                    let anthropic_req: anthropic_types::chat::ChatCompletionRequest =
                    converter.try_convert(body)
                        .map_err(InternalError::MapperError)?;
                    let anthropic_req_bytes =
                        serde_json::to_vec(&anthropic_req).map_err(|e| {
                            InternalError::Serialize {
                        ty: "anthropic_types::chat::ChatCompletionRequest",
                        error: e,
                    }
                        })?;
                    let body = Bytes::from(anthropic_req_bytes);
                    (body, target_path_and_query)
                } else {
                    tracing::warn!(
                        "Currently only /v1/chat/completions is supported"
                    );
                    todo!(
                        "Currently only /v1/chat/completions is supported for \
                         openai"
                    )
                }
            }
            (ApiEndpoint::Anthropic(source), ApiEndpoint::OpenAI(target)) => {
                tracing::trace!(source = ?source, target = ?target, "mapping request body");
                let converter = AnthropicConverter::new(&model_mapper);
                if let (Anthropic::Messages, OpenAI::ChatCompletions) =
                    (source, target)
                {
                    let body = serde_json::from_slice::<
                        anthropic_types::chat::ChatCompletionRequest,
                    >(body)
                    .map_err(InvalidRequestError::InvalidRequestBody)?;
                    let openai_req: openai_types::chat::ChatCompletionRequest =
                        converter
                            .try_convert(body)
                            .map_err(InternalError::MapperError)?;
                    let openai_req_bytes = serde_json::to_vec(&openai_req)
                        .map_err(|e| InternalError::Serialize {
                            ty: "anthropic_types::chat::ChatCompletionRequest",
                            error: e,
                        })?;
                    let body = Bytes::from(openai_req_bytes);
                    (body, target_path_and_query)
                } else {
                    tracing::warn!(
                        "Currently only /v1/chat/completions is supported"
                    );
                    todo!(
                        "Currently only /v1/chat/completions is supported for \
                         openai at the moment"
                    )
                }
            }
            _ => {
                tracing::warn!(
                    "Only mapping between openai and anthropic is supported \
                     at the moment"
                );
                todo!(
                    "only mapping between openai and anthropic is supported \
                     at the moment"
                )
            }
        };

        Ok((body, target_path_and_query))
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum OpenAI {
    ChatCompletions,
    Responses,
    LegacyCompletions,
}

impl OpenAI {
    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::ChatCompletions => "/v1/chat/completions",
            Self::LegacyCompletions => "/v1/completions",
            Self::Responses => "/v1/responses",
        }
    }
}

impl TryFrom<&PathAndQuery> for OpenAI {
    type Error = InvalidRequestError;

    fn try_from(value: &PathAndQuery) -> Result<Self, Self::Error> {
        match value.path() {
            "/v1/chat/completions" => Ok(Self::ChatCompletions),
            "/v1/completions" => Ok(Self::LegacyCompletions),
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
    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::Messages => "/v1/messages",
            Self::LegacyCompletions => "/v1/complete",
        }
    }
}

impl TryFrom<&PathAndQuery> for Anthropic {
    type Error = InvalidRequestError;

    fn try_from(value: &PathAndQuery) -> Result<Self, Self::Error> {
        match value.path() {
            "/v1/messages" => Ok(Self::Messages),
            "/v1/complete" => Ok(Self::LegacyCompletions),
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
            OpenAI::ChatCompletions | OpenAI::Responses => Self::Messages,
            OpenAI::LegacyCompletions => Self::LegacyCompletions,
        }
    }
}
