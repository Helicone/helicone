use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct ChatCompletionRequest {
    pub messages: Vec<ChatCompletionRequestMessage>,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    User,
    Assistant,
    System,
    Developer,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct ChatCompletionRequestMessage {
    pub role: Role,
    pub content: String,
}
