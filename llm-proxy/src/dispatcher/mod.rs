use std::pin::Pin;

use bytes::Bytes;
use futures::{Stream, StreamExt};
use reqwest_eventsource::{Event, EventSource};

use crate::error::internal::InternalError;

pub mod anthropic_client;
pub mod openai_client;
pub mod service;

pub use self::service::{Dispatcher, DispatcherService};

pub(crate) type BoxTryStream<I> =
    Pin<Box<dyn Stream<Item = Result<I, InternalError>> + Send>>;
pub(crate) type SSEStream = BoxTryStream<Bytes>;

/// Request which responds with SSE.
/// [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format)
pub(super) fn sse_stream(mut event_source: EventSource) -> SSEStream {
    let (tx, rx) = tokio::sync::mpsc::unbounded_channel();

    tokio::spawn(async move {
        while let Some(ev) = event_source.next().await {
            match ev {
                Err(e) => {
                    if let Err(_e) =
                        tx.send(Err(InternalError::StreamError(Box::new(e))))
                    {
                        // rx dropped
                        break;
                    }
                }
                Ok(event) => match event {
                    Event::Message(message) => {
                        if message.data == "[DONE]" {
                            break;
                        }

                        let data = Bytes::from(message.data);

                        if let Err(_e) = tx.send(Ok(data)) {
                            // rx dropped
                            break;
                        }
                    }
                    Event::Open => {}
                },
            }
        }

        event_source.close();
    });

    Box::pin(tokio_stream::wrappers::UnboundedReceiverStream::new(rx))
}
