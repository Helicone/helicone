use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use llm_proxy::{
    config::{Config, router::RouterConfigs},
    tests::{TestDefault, harness::Harness, mock::MockArgs},
};
use serde_json::json;
use tower::Service;

#[tokio::test]
#[serial_test::serial]
async fn openai_slow() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing load balancing behavior
    config.auth.require_auth = false;
    // enable multiple providers, test_default for RouterConfig has only a
    // single provider
    config.routers = RouterConfigs::default();
    let latency = 100;
    let requests = 10;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (..3).into()),
            ("success:anthropic:messages", (7..).into()),
            // Auth is disabled, so auth and logging services should not be
            // called
            ("success:jawn:whoami", 0.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .global_openai_latency(latency)
        .verify(false)
        .build();
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
}

#[tokio::test]
#[serial_test::serial]
async fn anthropic_slow() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing load balancing behavior
    config.auth.require_auth = false;
    // enable multiple providers, test_default for RouterConfig has only a
    // single provider
    config.routers = RouterConfigs::default();
    let latency = 10;
    let requests = 10;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (7..).into()),
            ("success:anthropic:messages", (..3).into()),
            // Auth is disabled, so auth and logging services should not be
            // called
            ("success:jawn:whoami", 0.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .global_anthropic_latency(latency)
        .verify(false)
        .build();
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
}
