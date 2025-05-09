use anthropic_ai_sdk::types::message::{
    CreateMessageParams, CreateMessageResponse,
};

use crate::endpoints::Endpoint;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Messages;

impl Endpoint for Messages {
    const PATH: &'static str = "/v1/messages";
    type RequestBody = CreateMessageParams;
    type ResponseBody = CreateMessageResponse;
}
