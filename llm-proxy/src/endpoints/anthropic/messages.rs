use std::str::FromStr;

use anthropic_ai_sdk::types::message::{
    self, CreateMessageParams, CreateMessageResponse,
};

use crate::{
    endpoints::{AiRequest, Endpoint},
    middleware::mapper::error::MapperError,
    types::model::Model,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub struct Messages;

impl Endpoint for Messages {
    const PATH: &'static str = "/v1/messages";
    type RequestBody = CreateMessageParams;
    type ResponseBody = CreateMessageResponse;
    type StreamResponseBody = message::StreamEvent;
}

impl AiRequest for CreateMessageParams {
    fn is_stream(&self) -> bool {
        self.stream.unwrap_or(false)
    }

    fn model(&self) -> Result<Model, MapperError> {
        Model::from_str(&self.model)
    }
}
