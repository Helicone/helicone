#[cfg(test)]
mod tests {
    use super::ControlPlaneClient;
    use crate::control_plane::{
        control_plane_state::ControlPlaneState, types::MessageTypeTX,
    };
    use futures::StreamExt;
    use std::net::SocketAddr;
    use std::time::Duration;
    use tokio::net::{TcpListener, TcpStream};
    use tokio_tungstenite::{accept_async, tungstenite::Message};

    /// Simple echo WebSocket server for testing
    async fn run_echo_server(listener: TcpListener) {
        while let Ok((stream, _)) = listener.accept().await {
            tokio::spawn(handle_connection(stream));
        }
    }

    async fn handle_connection(stream: TcpStream) {
        let ws_stream = accept_async(stream)
            .await
            .expect("WebSocket handshake failed");

        let (mut sender, mut receiver) = ws_stream.split();

        while let Some(msg) = receiver.next().await {
            if let Ok(msg) = msg {
                if msg.is_text() || msg.is_binary() {
                    // Echo the message back
                    let _ = sender.send(msg).await;
                }
            }
        }
    }

    #[tokio::test]
    async fn test_control_plane_client_connect() {
        // Start a simple echo server
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        tokio::spawn(run_echo_server(listener));

        // Give server time to start
        tokio::time::sleep(Duration::from_millis(100)).await;

        let ws_url = format!("ws://{}", addr);

        // Test basic connection
        let result = ControlPlaneClient::connect(&ws_url).await;
        assert!(
            result.is_ok(),
            "Should be able to connect to WebSocket server"
        );

        let client = result.unwrap();
        assert_eq!(client.url, ws_url);
        assert!(client.msg_tx.is_some(), "Should have a message sender");
    }

    #[tokio::test]
    async fn test_control_plane_client_send_message() {
        // Start echo server
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        tokio::spawn(run_echo_server(listener));
        tokio::time::sleep(Duration::from_millis(100)).await;

        let ws_url = format!("ws://{}", addr);
        let mut client = ControlPlaneClient::connect(&ws_url).await.unwrap();

        // Test sending a heartbeat message
        let result = client.send_message(MessageTypeTX::Heartbeat).await;
        assert!(result.is_ok(), "Should be able to send heartbeat message");
    }

    #[tokio::test]
    async fn test_control_plane_client_connection_failure() {
        // Try to connect to non-existent server
        let result = ControlPlaneClient::connect("ws://127.0.0.1:1").await;
        assert!(
            result.is_err(),
            "Should fail to connect to non-existent server"
        );
    }

    #[tokio::test]
    async fn test_send_message_without_connection() {
        // Create client with no connection
        let mut client = ControlPlaneClient {
            url: "ws://test".to_string(),
            state: ControlPlaneState::default(),
            msg_tx: None,
        };

        // Should handle gracefully when no connection exists
        let result = client.send_message(MessageTypeTX::Heartbeat).await;
        assert!(
            result.is_ok(),
            "Should handle missing connection gracefully"
        );
    }
}
