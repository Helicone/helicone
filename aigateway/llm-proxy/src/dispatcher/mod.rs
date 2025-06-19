pub mod anthropic_client;
mod bedrock_client;
pub mod client;
mod extensions;
pub mod google_gemini_client;
pub mod ollama_client;
pub mod openai_client;
pub mod service;

use std::pin::Pin;

use bytes::Bytes;
use futures::Stream;

pub use self::service::{Dispatcher, DispatcherService};
use crate::error::internal::InternalError;

pub(crate) type BoxTryStream<I> =
    Pin<Box<dyn Stream<Item = Result<I, InternalError>> + Send>>;
pub(crate) type SSEStream = BoxTryStream<Bytes>;
