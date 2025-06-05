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
    url: String,
}

fn handle_message(
    state: Arc<Mutex<ControlPlaneState>>,
    message: Message,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let m: MessageTypeRX = serde_json::from_str(&message.into_text()?)?;

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
                        let _ =
                            handle_message(Arc::clone(&state_clone), message)
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
        let m = match m {
            MessageTypeTX::Heartbeat => Message::Text("heartbeat".to_string()),
        };
        if let Some(ref mut tx) = self.msg_tx {
            match tx.send(m).await {
                Ok(_) => (),
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
