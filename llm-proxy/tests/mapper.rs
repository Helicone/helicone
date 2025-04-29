use http::{Method, Request, StatusCode};
use llm_proxy::{
    config::{Config, router::RouterConfigs},
    tests::{TestDefault, harness::Harness, mock::MockArgsBuilder},
};
use serde_json::json;
use tower::Service;

#[tokio::test]
#[serial_test::serial]
async fn mapper_openai_slow() {
    let mut config = Config::test_default();
    // enable multiple providers
    config.routers = RouterConfigs::default();
    let latency = 10;
    let requests = 100;
    let mock_args = MockArgsBuilder::default()
        .global_openai_latency(latency)
        .build()
        .unwrap();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;
    let body_bytes = serde_json::to_vec(&json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Hello, world!"
            }
        ]
    }))
    .unwrap();

    for _ in 0..requests {
        let request_body = axum_core::body::Body::from(body_bytes.clone());
        let request = Request::builder()
            .method(Method::POST)
            // default router
            .uri("http://router.helicone.com/router/v1/chat/completions")
            .body(request_body)
            .unwrap();
        let response = harness.call(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    let anthropic_received_requests = harness
        .mock
        .anthropic_mock
        .received_requests_for("POST", "/v1/messages")
        .await
        .expect("no requests received");
    let openai_received_requests = harness
        .mock
        .openai_mock
        .received_requests_for("POST", "/v1/chat/completions")
        .await
        .expect("no requests received");
    println!("--------------------------------");
    println!("openai latency: {}", latency);
    println!(
        "anthropic received_requests: {:?}",
        anthropic_received_requests.len()
    );
    println!(
        "openai received_requests: {:?}",
        openai_received_requests.len()
    );
    let ratio = anthropic_received_requests.len() as f64 / requests as f64;
    println!("anthropic requests received ratio: {:?}", ratio);
    println!("--------------------------------");
    assert!(ratio >= 0.8);
}

#[tokio::test]
#[serial_test::serial]
async fn mapper_anthropic_slow() {
    let mut config = Config::test_default();
    // enable multiple providers
    config.routers = RouterConfigs::default();
    let latency = 10;
    let requests = 100;
    let mock_args = MockArgsBuilder::default()
        .global_anthropic_latency(latency)
        .build()
        .unwrap();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;
    let body_bytes = serde_json::to_vec(&json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Hello, world!"
            }
        ]
    }))
    .unwrap();

    for _ in 0..requests {
        let request_body = axum_core::body::Body::from(body_bytes.clone());
        let request = Request::builder()
            .method(Method::POST)
            // default router
            .uri("http://router.helicone.com/router/v1/chat/completions")
            .body(request_body)
            .unwrap();
        let response = harness.call(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    let anthropic_received_requests = harness
        .mock
        .anthropic_mock
        .received_requests_for("POST", "/v1/messages")
        .await
        .expect("no requests received");
    let openai_received_requests = harness
        .mock
        .openai_mock
        .received_requests_for("POST", "/v1/chat/completions")
        .await
        .expect("no requests received");
    println!("--------------------------------");
    println!("anthropic latency: {}", latency);
    println!(
        "anthropic received_requests: {:?}",
        anthropic_received_requests.len()
    );
    println!(
        "openai received_requests: {:?}",
        openai_received_requests.len()
    );
    let ratio = openai_received_requests.len() as f64 / requests as f64;
    println!("openai requests received ratio: {:?}", ratio);
    println!("--------------------------------");
    assert!(ratio >= 0.8);
}
