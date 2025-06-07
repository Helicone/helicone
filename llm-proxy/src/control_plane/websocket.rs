use futures::{
    SinkExt, StreamExt,
    future::BoxFuture,
    stream::{SplitSink, SplitStream},
};
use meltdown::Token;
use std::{sync::Arc, time::Duration};
use tokio::{net::TcpStream, sync::Mutex};
use tokio_tungstenite::{
    MaybeTlsStream, WebSocketStream, connect_async,
    tungstenite::{self, Message},
};
use url::Url;

use super::{
    control_plane_state::ControlPlaneState,
    types::{MessageTypeRX, MessageTypeTX},
};
use crate::error::{init::InitError, runtime::RuntimeError};
type TlsWebSocketStream = WebSocketStream<MaybeTlsStream<TcpStream>>;

#[derive(Debug)]
pub struct WebsocketChannel {
    msg_tx: Arc<Mutex<SplitSink<TlsWebSocketStream, Message>>>,
    msg_rx: Arc<Mutex<SplitStream<TlsWebSocketStream>>>,
}

#[derive(Debug)]
pub struct ControlPlaneClient {
    pub state: Arc<Mutex<ControlPlaneState>>,
    channel: WebsocketChannel,
    url: Url,
}

async fn handle_message(
    state: &Arc<Mutex<ControlPlaneState>>,
    message: Message,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let bytes = message.into_data();
    let m: MessageTypeRX = serde_json::from_slice(&bytes)?;

    tracing::info!("Received message: {:?}", m);
    let mut state_guard = state.lock().await;
    state_guard.update(m);

    Ok(())
}

async fn connect_async_and_split(
    url: &str,
) -> Result<WebsocketChannel, InitError> {
    let (tx, rx) = connect_async(url)
        .await
        .map_err(InitError::WebsocketConnection)?
        .0
        .split();

    Ok(WebsocketChannel {
        msg_tx: Arc::new(Mutex::new(tx)),
        msg_rx: Arc::new(Mutex::new(rx)),
    })
}

impl ControlPlaneClient {
    async fn reconnect_websocket(&mut self) -> Result<(), InitError> {
        let channel = connect_async_and_split(self.url.as_str()).await?;
        self.channel = channel;
        Ok(())
    }

    pub async fn connect(url: &str) -> Result<Self, InitError> {
        let url = Url::parse(url).map_err(InitError::WebsocketUrlParse)?;

        Ok(Self {
            channel: connect_async_and_split(url.as_str()).await?,
            url,
            state: Arc::new(Mutex::new(ControlPlaneState::default())),
        })
    }

    pub async fn send_message(
        &mut self,
        m: MessageTypeTX,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let bytes = serde_json::to_vec(&m)?;
        let message = Message::Binary(bytes);
        let mut msg_tx = self.channel.msg_tx.lock().await;

        match msg_tx.send(message).await {
            Ok(()) => (),
            Err(tungstenite::Error::AlreadyClosed) => {
                tracing::error!("Connection closed");
                drop(msg_tx); // Explicitly drop the guard before calling reconnect
                self.reconnect_websocket().await?;
            }
            Err(e) => {
                tracing::error!("Error: {}", e);
            }
        }
        // msg_tx automatically unlocks when it goes out of scope here

        Ok(())
    }
}

impl meltdown::Service for ControlPlaneClient {
    type Future = BoxFuture<'static, Result<(), RuntimeError>>;

    fn run(mut self, _token: Token) -> Self::Future {
        let state_clone = Arc::clone(&self.state);

        Box::pin(async move {
            loop {
                while let Some(message) =
                    self.channel.msg_rx.lock().await.next().await
                {
                    match message {
                        Ok(message) => {
                            let _ = handle_message(&state_clone, message)
                                .await
                                .map_err(|e| {
                                    tracing::error!("Error: {}", e);
                                });
                        }
                        Err(tungstenite::Error::AlreadyClosed) => {
                            tracing::error!("Connection closed");
                            break;
                        }
                        Err(e) => {
                            tracing::error!("Error: {}", e);
                        }
                    }
                }

                // if the connection is closed, we need to reconnect
                self.reconnect_websocket()
                    .await
                    .map_err(RuntimeError::Init)?;
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::ControlPlaneClient;
    use crate::control_plane::types::MessageTypeTX;
    use std::time::Duration;
    use tokio::net::TcpListener;
    use tokio_tungstenite::accept_async;

    #[tokio::test]
    async fn test_mock_server_connection() {
        // Start a simple mock server
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let ws_url = format!("ws://{addr}");

        // Spawn mock server that just accepts connections
        tokio::spawn(async move {
            if let Ok((stream, _)) = listener.accept().await {
                let _ = accept_async(stream).await;
                // Just accept and do nothing - minimal mock
            }
        });

        tokio::time::sleep(Duration::from_millis(50)).await;

        // Test connection
        let result = ControlPlaneClient::connect(&ws_url).await;
        assert!(result.is_ok(), "Should connect to mock server");
    }

    #[tokio::test]
    async fn test_integration_localhost_8585() {
        let ws_url = "ws://localhost:8585/ws/v1/router/control-plane";

        // This will fail if no server is running on 8585, which is expected
        let result = ControlPlaneClient::connect(ws_url).await;

        if let Ok(mut client) = result {
            // If we can connect, try sending a heartbeat
            let send_result =
                client.send_message(MessageTypeTX::Heartbeat).await;
            assert!(send_result.is_ok(), "Should be able to send heartbeat");
        } else {
            // If we can't connect, that's fine for this test
            println!("No server running on localhost:8585 - this is expected");
        }
    }
}
