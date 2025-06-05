use futures::{SinkExt, StreamExt};
use std::time::Duration;
use tokio::sync::{broadcast, mpsc};
use tokio_tungstenite::{
    MaybeTlsStream, WebSocketStream, connect_async, tungstenite::Message,
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
    msg_tx: mpsc::UnboundedSender<Message>,
    evt_rx: broadcast::Receiver<WebSocketEvent>,
    join: tokio::task::JoinHandle<()>,
    rec_tx: mpsc::UnboundedSender<()>,
}

impl WebSocketClient {
    #[allow(clippy::unused_async)]
    pub async fn connect(
        url: &str,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        Self::connect_with_config(url, Default::default())
    }

    /// Connect with custom reconnection configuration
    pub fn connect_with_config(
        url: &str,
        cfg: ReconnectConfig,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let (msg_tx, msg_rx) = mpsc::unbounded_channel();
        let (ev_tx, ev_rx) = broadcast::channel(1000);
        let (rec_tx, rec_rx) = mpsc::unbounded_channel();

        let join = tokio::spawn(Self::run(
            url.to_string(),
            cfg,
            msg_rx,
            rec_rx,
            ev_tx,
        ));

        Ok(Self {
            msg_tx,
            evt_rx: ev_rx,
            join,
            rec_tx,
        })
    }

    /// Send a message to the WebSocket
    pub fn send_message(
        &self,
        m: Message,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.msg_tx.send(m)?;
        Ok(())
    }

    /// Subscribe to WebSocket events (each subscriber gets their own receiver)
    #[must_use]
    pub fn subscribe(&self) -> broadcast::Receiver<WebSocketEvent> {
        self.evt_rx.resubscribe()
    }

    /// Trigger a manual reconnection attempt
    pub fn reconnect(
        &self,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.rec_tx.send(())?;
        Ok(())
    }

    async fn run(
        url: String,
        cfg: ReconnectConfig,
        mut msg_rx: mpsc::UnboundedReceiver<Message>,
        mut rec_rx: mpsc::UnboundedReceiver<()>,
        ev_tx: broadcast::Sender<WebSocketEvent>,
    ) {
        let mut attempts = 0;
        let mut delay = cfg.initial_delay;

        loop {
            match connect_async(&url).await {
                Ok((stream, _)) => {
                    info!("WebSocket connected to {}", url);
                    let _ = ev_tx.send(WebSocketEvent::Connected);
                    attempts = 0;
                    delay = cfg.initial_delay;

                    match Self::pump(stream, &mut msg_rx, &mut rec_rx, &ev_tx)
                        .await
                    {
                        Disconnect::Manual => break,
                        Disconnect::ManualReconnect => continue,
                        Disconnect::Error(e) => {
                            error!("WebSocket error: {}", e);
                            let _ = ev_tx.send(WebSocketEvent::Error(e));
                        }
                    }

                    let _ = ev_tx.send(WebSocketEvent::Disconnected);
                    if !cfg.auto_reconnect {
                        break;
                    }
                }
                Err(e) => {
                    error!("Failed to connect: {}", e);
                    let _ = ev_tx.send(WebSocketEvent::ReconnectFailed {
                        attempt: attempts + 1,
                        error: e.to_string(),
                    });
                }
            }

            if cfg.max_attempts > 0 && attempts >= cfg.max_attempts {
                let _ = ev_tx.send(WebSocketEvent::ReconnectGaveUp {
                    total_attempts: attempts,
                });
                break;
            }

            attempts += 1;
            let _ = ev_tx.send(WebSocketEvent::Reconnecting {
                attempt: attempts,
                delay,
            });
            tokio::time::sleep(delay).await;
            delay = Duration::from_millis(
                (delay.as_millis() * cfg.backoff_multiplier as u128)
                    .min(cfg.max_delay.as_millis()) as u64,
            );
        }

        debug!("WebSocket handler task finished");
    }

    async fn pump(
        stream: WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>,
        msg_rx: &mut mpsc::UnboundedReceiver<Message>,
        rec_rx: &mut mpsc::UnboundedReceiver<()>,
        ev_tx: &broadcast::Sender<WebSocketEvent>,
    ) -> Disconnect {
        let (mut tx, mut rx) = stream.split();
        loop {
            tokio::select! {
                Some(m) = msg_rx.recv() => {
                    if let Err(e) = tx.send(m).await {
                        return Disconnect::Error(format!("Send error: {e}"));
                    }
                }
                Some(r) = rx.next() => match r {
                    Ok(m) => { let _ = ev_tx.send(WebSocketEvent::Message(m)); },
                    Err(e) => return Disconnect::Error(format!("Receive error: {e}")),
                },
                Some(()) = rec_rx.recv() => return Disconnect::ManualReconnect,
                else => return Disconnect::Manual,
            }
        }
    }

    /// Gracefully close the WebSocket connection
    pub async fn close(
        self,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        drop(self.msg_tx);
        drop(self.rec_tx);
        self.join.await?;
        Ok(())
    }
}

#[derive(Debug)]
enum Disconnect {
    Manual,
    Error(String),
    ManualReconnect,
}
