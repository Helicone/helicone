/// WebSocket message event that subscribers can listen to
#[derive(Debug, Clone)]
pub enum WebSocketEvent {
    Connected,
    Message(Message),
    Disconnected,
    Error(String),
}

/// WebSocket client with async event subscription capabilities
#[derive(Debug)]
pub struct WebSocketClient {
    /// Sender for outgoing messages
    message_tx: mpsc::UnboundedSender<Message>,
    /// Receiver for incoming events (cloneable for multiple subscribers)
    event_rx: broadcast::Receiver<WebSocketEvent>,
    /// Handle to the background task
    task_handle: tokio::task::JoinHandle<()>,
}

impl WebSocketClient {
    /// Connect to a WebSocket URL and return a client with event channels
    pub async fn connect(
        url: &str,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let (ws_stream, _response) =
            tokio_tungstenite::connect_async(url).await?;

        // Create channels
        let (message_tx, message_rx) = mpsc::unbounded_channel::<Message>();
        let (event_tx, event_rx) = broadcast::channel::<WebSocketEvent>(1000);

        // Spawn background task to handle WebSocket communication
        let task_handle = tokio::spawn(Self::handle_websocket(
            ws_stream,
            message_rx,
            event_tx.clone(),
        ));

        // Send connected event
        let _ = event_tx.send(WebSocketEvent::Connected);

        Ok(Self {
            message_tx,
            event_rx,
            task_handle,
        })
    }

    /// Send a message to the WebSocket
    pub fn send_message(
        &self,
        message: Message,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.message_tx.send(message).map_err(|e| {
            Box::new(e) as Box<dyn std::error::Error + Send + Sync>
        })?;
        Ok(())
    }

    /// Subscribe to WebSocket events (each subscriber gets their own receiver)
    #[must_use]
    pub fn subscribe(&self) -> broadcast::Receiver<WebSocketEvent> {
        self.event_rx.resubscribe()
    }

    /// Background task that handles the WebSocket connection
    async fn handle_websocket(
        ws_stream: WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>,
        mut message_rx: mpsc::UnboundedReceiver<Message>,
        event_tx: broadcast::Sender<WebSocketEvent>,
    ) {
        let (mut ws_tx, mut ws_rx) = ws_stream.split();

        loop {
            tokio::select! {
                // Handle outgoing messages
                Some(message) = message_rx.recv() => {
                    if let Err(e) = ws_tx.send(message).await {
                        error!("Failed to send WebSocket message: {}", e);
                        let _ = event_tx.send(WebSocketEvent::Error(format!("Send error: {e}")));
                        break;
                    }
                }

                // Handle incoming messages
                Some(message_result) = ws_rx.next() => {
                    match message_result {
                        Ok(message) => {
                            debug!("Received WebSocket message: {:?}", message);
                            let _ = event_tx.send(WebSocketEvent::Message(message));
                        }
                        Err(e) => {
                            error!("WebSocket receive error: {}", e);
                            let _ = event_tx.send(WebSocketEvent::Error(format!("Receive error: {e}")));
                            break;
                        }
                    }
                }

                // If both channels are closed, exit
                else => {
                    debug!("WebSocket channels closed, exiting task");
                    break;
                }
            }
        }

        let _ = event_tx.send(WebSocketEvent::Disconnected);
        debug!("WebSocket handler task finished");
    }

    /// Gracefully close the WebSocket connection
    pub async fn close(
        self,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // Drop the message sender to signal the task to finish
        drop(self.message_tx);

        // Wait for the background task to complete
        self.task_handle.await?;

        Ok(())
    }
}
