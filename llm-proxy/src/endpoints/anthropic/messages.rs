use anthropic_ai_sdk::types::message::{
    self, CreateMessageParams, CreateMessageResponse,
};

use crate::endpoints::{Endpoint, StreamRequest};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Messages;

impl Endpoint for Messages {
    const PATH: &'static str = "/v1/messages";
    type RequestBody = CreateMessageParams;
    type ResponseBody = CreateMessageResponse;
    // TODO: support anthropic streams
    type StreamResponseBody = message::StreamEvent;
}

impl StreamRequest for CreateMessageParams {
    fn is_stream(&self) -> bool {
        self.stream.unwrap_or(false)
    }
}
