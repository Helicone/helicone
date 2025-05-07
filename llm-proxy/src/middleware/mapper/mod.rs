//!
//! `OpenAI`:
//! - /v1/chat/completions
//! - /v1/completions
//! - /v1/responses
//!
//! Anthropic:
//! - /v1/completions
//! - /v1/messages
//!
//! Provider | Primary REST path(s) you hit
//! `OpenAI` | POST <https://api.openai.com/v1/chat/completions> – chat / function calling The Customize Windows  POST <https://api.openai.com/v1/embeddings> – vector embeddings `OpenAI` Xiniushu  POST <https://api.openai.com/v1/images/generations> – DALL·E / GPT-Image `OpenAI` Community
//! Anthropic (Claude) | POST <https://api.anthropic.com/v1/messages> – Claude 3+ chat endpoint Anthropic Docs  POST <https://api.anthropic.com/v1/embeddings> – embeddings (beta) Anthropic Docs  Legacy: POST /v1/complete Anthropic Docs
//! Google Vertex AI (Gemini) | POST <https://{REGION}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent> – text/vision/multimodal Google Cloud
//! Amazon Bedrock | POST <https://bedrock-runtime.{region}.amazonaws.com/model/{modelId}/invoke> – unified `InvokeModel` for every FM AWS Documentation
//! Azure `OpenAI` | POST <https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=YYYY-MM-DD> – same payloads as `OpenAI`, Azure-flavored URL Microsoft Learn
//! Mistral AI | POST <https://api.mistral.ai/v1/chat/completions> – chat/agents/Codestral Mistral Docs  POST <https://api.mistral.ai/v1/embeddings> – embeddings Mistral Docs
//! Cohere | POST <https://api.cohere.com/v2/chat> – chat + RAG connectors Cohere  POST <https://api.cohere.com/v2/embed> – embeddings Cohere
//! Hugging Face (Serverless Inference) | POST <https://api-inference.huggingface.co/models/{model>} – run any Hub model Hugging Face Forums
//! Stability AI (Stable Image v2beta) | POST <https://api.stability.ai/v2beta/stable-image/generate/{quality>} – SD 3.5/SD3 image generation (ultra, sd3, etc.) Stability AI
//!
//! `TryFrom` req path to some struct/enum that represents an Ai Api Endpoint,
//! this struct then helps us deserialize to the correct type and then
//! call the `TryConvert` fn.
pub mod anthropic;
pub mod endpoint;
pub mod error;
pub mod openai;
pub mod service;

pub use self::service::*;

/// `TryFrom` but allows us to implement it for foreign types, so we can
/// maintain boundaries between our business logic and the provider types.
pub trait TryConvert<Source, Target>: Sized {
    type Error;

    fn try_convert(
        &self,
        value: Source,
    ) -> std::result::Result<Target, Self::Error>;
}

pub trait Convert<Source>: Sized {
    fn convert(value: Source) -> Self;
}
