use std::{sync::Arc, time::Duration};

use futures::{
    SinkExt, StreamExt,
    future::BoxFuture,
    stream::{SplitSink, SplitStream},
};
use meltdown::Token;
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
use crate::{
    config::helicone::HeliconeConfig,
    error::{init::InitError, runtime::RuntimeError},
};
type TlsWebSocketStream = WebSocketStream<MaybeTlsStream<TcpStream>>;

#[derive(Debug)]
pub struct WebsocketChannel {
    msg_tx: SplitSink<TlsWebSocketStream, Message>,
    msg_rx: SplitStream<TlsWebSocketStream>,
}

#[derive(Debug)]
pub struct ControlPlaneClient {
    pub state: Arc<Mutex<ControlPlaneState>>,
    channel: WebsocketChannel,
    /// Config about Control plane, such as the websocket url,
    /// reconnect interval/backoff policy, heartbeat interval, etc.
    config: HeliconeConfig,
}

async fn handle_message(
    state: &Arc<Mutex<ControlPlaneState>>,
    message: Message,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let bytes = message.into_data();
    let m: MessageTypeRX = serde_json::from_slice(&bytes)?;

    tracing::info!(message = ?m, "received message from control plane");
    let mut state_guard = state.lock().await;
    state_guard.update(m);

    Ok(())
}

async fn connect_async_and_split(
    url: &Url,
) -> Result<WebsocketChannel, InitError> {
    let (tx, rx) = connect_async(url)
        .await
        .map_err(|e| InitError::WebsocketConnection(Box::new(e)))?
        .0
        .split();

    Ok(WebsocketChannel {
        msg_tx: tx,
        msg_rx: rx,
    })
}

impl ControlPlaneClient {
    async fn reconnect_websocket(&mut self) -> Result<(), InitError> {
        // TODO: add retries w/ exponential backoff
        // https://crates.io/crates/backon
        let channel =
            connect_async_and_split(&self.config.websocket_url).await?;
        self.channel = channel;
        tracing::info!("Successfully reconnected to control plane");
        Ok(())
    }

    pub async fn connect(
        control_plane_state: Arc<Mutex<ControlPlaneState>>,
        config: HeliconeConfig,
    ) -> Result<Self, InitError> {
        Ok(Self {
            channel: connect_async_and_split(&config.websocket_url).await?,
            config,
            state: control_plane_state,
        })
    }

    pub async fn send_message(
        &mut self,
        m: MessageTypeTX,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let bytes = serde_json::to_vec(&m)?;
        let message = Message::Binary(bytes);

        match self.channel.msg_tx.send(message).await {
            Ok(()) => (),
            Err(tungstenite::Error::AlreadyClosed) => {
                tracing::error!("websocket connection closed, reconnecting...");
                self.reconnect_websocket().await?;
            }
            Err(e) => {
                tracing::error!(error = %e, "websocket error");
            }
        }

        Ok(())
    }
}

impl meltdown::Service for ControlPlaneClient {
    type Future = BoxFuture<'static, Result<(), RuntimeError>>;

    fn run(mut self, _token: Token) -> Self::Future {
        let state_clone = Arc::clone(&self.state);

        Box::pin(async move {
            loop {
                while let Some(message) = self.channel.msg_rx.next().await {
                    match message {
                        Ok(message) => {
                            let _ = handle_message(&state_clone, message)
                                .await
                                .map_err(|e| {
                                    tracing::error!(error = ?e, "websocket error");
                                });
                        }
                        Err(tungstenite::Error::AlreadyClosed) => {
                            tracing::error!(
                                "websocket connection closed, reconnecting..."
                            );
                            self.reconnect_websocket()
                                .await
                                .map_err(RuntimeError::Init)?;
                        }
                        Err(e) => {
                            tracing::error!(error = ?e, "websocket error");
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
    use std::time::Duration;

    use tokio::net::TcpListener;
    use tokio_tungstenite::accept_async;

    use super::ControlPlaneClient;
    use crate::{
        config::helicone::HeliconeConfig, control_plane::types::MessageTypeTX,
    };

    #[tokio::test]
    async fn test_mock_server_connection() {
        // Start a simple mock server
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let ws_url = format!("ws://{addr}");
        let mut helicone_config = HeliconeConfig::default();
        helicone_config.websocket_url = ws_url.parse().unwrap();

        // Spawn mock server that just accepts connections
        tokio::spawn(async move {
            if let Ok((stream, _)) = listener.accept().await {
                let _ = accept_async(stream).await;
                // Just accept and do nothing - minimal mock
            }
        });

        tokio::time::sleep(Duration::from_millis(50)).await;

        // Test connection
        let result =
            ControlPlaneClient::connect(Default::default(), helicone_config)
                .await;
        assert!(result.is_ok(), "Should connect to mock server");
    }

    #[tokio::test]
    async fn test_integration_localhost_8585() {
        let helicone_config = HeliconeConfig::default();

        // This will fail if no server is running on 8585, which is expected
        let result =
            ControlPlaneClient::connect(Default::default(), helicone_config)
                .await;

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
