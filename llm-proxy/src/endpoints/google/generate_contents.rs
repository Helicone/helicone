use gemini_rust::{GenerateContentRequest, GenerationResponse};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub struct GenerateContents;

impl crate::endpoints::Endpoint for GenerateContents {
    const PATH: &'static str = "/v1/messages";
    type RequestBody = GenerateContentRequest;
    type ResponseBody = GenerationResponse;
    type StreamResponseBody = GenerationResponse;
}
