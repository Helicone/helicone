use http::{Method, Request, StatusCode};
use llm_proxy::{
    config::{Config, router::RouterConfigs},
    tests::{TestDefault, harness::Harness},
};
use serde_json::json;
use tower::Service;

#[tokio::test]
async fn mapper_anthropic_fast() {
    let mut config = Config::test_default();
    // enable multiple providers
    config.routers = RouterConfigs::default();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_openai_latency(200)
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

    for _ in 0..100 {
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

    // assert that the request was proxied to the mock server correctly
    let received_requests = harness
        .mock
        .anthropic_mock
        .received_requests_for("POST", "/v1/messages")
        .await
        .expect("no requests received");
    assert!(received_requests.len() > 90);
}

#[tokio::test]
async fn mapper_openai_fast() {
    let mut config = Config::test_default();
    // enable multiple providers
    config.routers = RouterConfigs::default();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_anthropic_latency(200)
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

    for _ in 0..100 {
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

    // assert that the request was proxied to the mock server correctly
    let received_requests = harness
        .mock
        .openai_mock
        .received_requests_for("POST", "/v1/chat/completions")
        .await
        .expect("no requests received");
    println!("received_requests: {:?}", received_requests.len());
    assert!(received_requests.len() > 90);
}
