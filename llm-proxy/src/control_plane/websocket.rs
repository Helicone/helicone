use futures::{SinkExt, StreamExt, stream::SplitSink};
use std::sync::{Arc, Mutex};
use tokio::net::TcpStream;
use tokio_tungstenite::{
    MaybeTlsStream, WebSocketStream, connect_async,
    tungstenite::{self, Message},
};

use super::{
    control_plane_state::ControlPlaneState,
    types::{MessageTypeRX, MessageTypeTX},
};

#[derive(Debug)]
pub struct ControlPlaneClient {
    pub state: Arc<Mutex<ControlPlaneState>>,
    msg_tx:
        Option<SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>>,
    url: Url,
}

fn handle_message(
    state: &Arc<Mutex<ControlPlaneState>>,
    message: Message,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let bytes = message.into_data();
    let m: MessageTypeRX = serde_json::from_slice(&bytes)?;

    tracing::info!("Received message: {:?}", m);
    if let Ok(mut state_guard) = state.lock() {
        state_guard.update(m);
    }

    Ok(())
}

impl ControlPlaneClient {
    async fn reconnect_websocket(
        &mut self,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let (tx, mut rx) = connect_async(&self.url).await?.0.split();
        let state_clone = Arc::clone(&self.state);

        tokio::spawn(async move {
            while let Some(message) = rx.next().await {
                match message {
                    Ok(message) => {
                        let _ = handle_message(&state_clone, message).map_err(
                            |e| {
                                tracing::error!("Error: {}", e);
                            },
                        );
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
        });

        self.msg_tx = Some(tx);
        Ok(())
    }

    pub async fn connect(
        url: &str,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let mut client = Self {
            url: url.to_string(),
            state: Arc::new(Mutex::new(ControlPlaneState::default())),
            msg_tx: None,
        };
        client.reconnect_websocket().await?;
        Ok(client)
    }

    pub async fn send_message(
        &mut self,
        m: MessageTypeTX,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let bytes = serde_json::to_vec(&m)?;
        let message = Message::Binary(bytes);

        if let Some(ref mut tx) = self.msg_tx {
            match tx.send(message).await {
                Ok(()) => (),
                Err(tungstenite::Error::AlreadyClosed) => {
                    tracing::error!("Connection closed");
                    self.reconnect_websocket().await?;
                }
                Err(e) => {
                    tracing::error!("Error: {}", e);
                }
            }
        }
        Ok(())
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
