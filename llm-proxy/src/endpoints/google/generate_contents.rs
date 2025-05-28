use gemini_rust::{GenerateContentRequest, GenerationResponse};

use crate::endpoints::StreamRequest;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub struct GenerateContents;

impl crate::endpoints::Endpoint for GenerateContents {
    // https://ai.google.dev/gemini-api/docs/openai
    const PATH: &'static str =
        "https://generativelanguage.googleapis.com/v1beta/openai/";
    type RequestBody = GenerateContentRequest;
    type ResponseBody = GenerationResponse;
    type StreamResponseBody = GenerationResponse;
}

impl StreamRequest for GenerateContentRequest {
    fn is_stream(&self) -> bool {
        false
    }
}
