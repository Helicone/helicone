use futures::{SinkExt, StreamExt};
use std::time::Duration;
use tokio::sync::{broadcast, mpsc};
use tokio_tungstenite::{
    MaybeTlsStream, WebSocketStream, tungstenite::Message,
};
use tracing::{debug, error, info};

/// WebSocket message event that subscribers can listen to
#[derive(Debug, Clone)]
pub enum WebSocketEvent {
    Connected,
    Message(Message),
    Disconnected,
    Reconnecting { attempt: u32, delay: Duration },
    ReconnectFailed { attempt: u32, error: String },
    ReconnectGaveUp { total_attempts: u32 },
    Error(String),
}

/// Configuration for WebSocket reconnection behavior
#[derive(Debug, Clone)]
pub struct ReconnectConfig {
    pub auto_reconnect: bool,
    /// Maximum number of reconnection attempts (0 = unlimited)
    pub max_attempts: u32,
    pub initial_delay: Duration,
    pub max_delay: Duration,
    pub backoff_multiplier: u64,
}

impl Default for ReconnectConfig {
    fn default() -> Self {
        Self {
            auto_reconnect: true,
            max_attempts: 10,
            initial_delay: Duration::from_millis(100),
            max_delay: Duration::from_secs(30),
            backoff_multiplier: 2,
        }
    }
}

/// WebSocket client with async event subscription capabilities
#[derive(Debug)]
pub struct WebSocketClient {
    message_tx: mpsc::UnboundedSender<Message>,
    event_rx: broadcast::Receiver<WebSocketEvent>,
    task_handle: tokio::task::JoinHandle<()>,
    reconnect_tx: mpsc::UnboundedSender<()>,
}

impl WebSocketClient {
    #[allow(clippy::unused_async)]
    pub async fn connect(
        url: &str,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        Self::connect_with_config(url, ReconnectConfig::default())
    }

    /// Connect with custom reconnection configuration
    pub fn connect_with_config(
        url: &str,
        reconnect_config: ReconnectConfig,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let (message_tx, message_rx) = mpsc::unbounded_channel();
        let (event_tx, event_rx) = broadcast::channel(1000);
        let (reconnect_tx, reconnect_rx) = mpsc::unbounded_channel();

        let task_handle = tokio::spawn(Self::handle_websocket_with_reconnect(
            url.to_string(),
            reconnect_config,
            message_rx,
            reconnect_rx,
            event_tx,
        ));

        Ok(Self {
            message_tx,
            event_rx,
            task_handle,
            reconnect_tx,
        })
    }

    /// Send a message to the WebSocket
    pub fn send_message(
        &self,
        message: Message,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.message_tx.send(message)?;
        Ok(())
    }

    /// Subscribe to WebSocket events (each subscriber gets their own receiver)
    #[must_use]
    pub fn subscribe(&self) -> broadcast::Receiver<WebSocketEvent> {
        self.event_rx.resubscribe()
    }

    /// Trigger a manual reconnection attempt
    pub fn reconnect(
        &self,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.reconnect_tx.send(())?;
        Ok(())
    }

    async fn handle_websocket_with_reconnect(
        url: String,
        config: ReconnectConfig,
        mut message_rx: mpsc::UnboundedReceiver<Message>,
        mut reconnect_rx: mpsc::UnboundedReceiver<()>,
        event_tx: broadcast::Sender<WebSocketEvent>,
    ) {
        let mut reconnect_attempts = 0u32;
        let mut current_delay = config.initial_delay;

        loop {
            match tokio_tungstenite::connect_async(&url).await {
                Ok((ws_stream, _)) => {
                    info!("WebSocket connected to {}", url);
                    let _ = event_tx.send(WebSocketEvent::Connected);

                    reconnect_attempts = 0;
                    current_delay = config.initial_delay;

                    let disconnect_reason = Self::handle_websocket_connection(
                        ws_stream,
                        &mut message_rx,
                        &mut reconnect_rx,
                        &event_tx,
                    )
                    .await;

                    match disconnect_reason {
                        DisconnectReason::Manual => {
                            debug!("Manual disconnect requested");
                            break;
                        }
                        DisconnectReason::Error(e) => {
                            error!(
                                "WebSocket disconnected due to error: {}",
                                e
                            );
                            let _ = event_tx.send(WebSocketEvent::Error(e));
                        }
                        DisconnectReason::ManualReconnect => {
                            info!("Manual reconnection requested");
                            continue;
                        }
                    }

                    let _ = event_tx.send(WebSocketEvent::Disconnected);

                    if !config.auto_reconnect {
                        break;
                    }
                }
                Err(e) => {
                    error!("Failed to connect to WebSocket: {}", e);
                    let _ = event_tx.send(WebSocketEvent::ReconnectFailed {
                        attempt: reconnect_attempts + 1,
                        error: e.to_string(),
                    });
                }
            }

            if config.max_attempts > 0
                && reconnect_attempts >= config.max_attempts
            {
                error!(
                    "Giving up after {} reconnection attempts",
                    reconnect_attempts
                );
                let _ = event_tx.send(WebSocketEvent::ReconnectGaveUp {
                    total_attempts: reconnect_attempts,
                });
                break;
            }

            reconnect_attempts += 1;

            let _ = event_tx.send(WebSocketEvent::Reconnecting {
                attempt: reconnect_attempts,
                delay: current_delay,
            });

            tokio::time::sleep(current_delay).await;

            let new_delay_millis = (current_delay.as_millis()
                * u128::from(config.backoff_multiplier))
            .min(config.max_delay.as_millis());
            current_delay = Duration::from_millis(
                new_delay_millis.try_into().unwrap_or(u64::MAX),
            );
        }

        debug!("WebSocket handler task finished");
    }

    async fn handle_websocket_connection(
        ws_stream: WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>,
        message_rx: &mut mpsc::UnboundedReceiver<Message>,
        reconnect_rx: &mut mpsc::UnboundedReceiver<()>,
        event_tx: &broadcast::Sender<WebSocketEvent>,
    ) -> DisconnectReason {
        let (mut ws_tx, mut ws_rx) = ws_stream.split();

        loop {
            tokio::select! {
                Some(message) = message_rx.recv() => {
                    if let Err(e) = ws_tx.send(message).await {
                        error!("Failed to send WebSocket message: {}", e);
                        return DisconnectReason::Error(format!("Send error: {e}"));
                    }
                }

                Some(message_result) = ws_rx.next() => {
                    match message_result {
                        Ok(message) => {
                            debug!("Received WebSocket message: {:?}", message);
                            let _ = event_tx.send(WebSocketEvent::Message(message));
                        }
                        Err(e) => {
                            error!("WebSocket receive error: {}", e);
                            return DisconnectReason::Error(format!("Receive error: {e}"));
                        }
                    }
                }

                Some(()) = reconnect_rx.recv() => {
                    info!("Manual reconnection requested");
                    return DisconnectReason::ManualReconnect;
                }

                else => {
                    debug!("WebSocket channels closed, exiting gracefully");
                    return DisconnectReason::Manual;
                }
            }
        }
    }

    /// Gracefully close the WebSocket connection
    pub async fn close(
        self,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        drop(self.message_tx);
        drop(self.reconnect_tx);
        self.task_handle.await?;
        Ok(())
    }
}

#[derive(Debug)]
enum DisconnectReason {
    Manual,
    Error(String),
    ManualReconnect,
}
