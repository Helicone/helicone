use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use llm_proxy::{
    config::Config,
    tests::{TestDefault, harness::Harness, mock::MockArgs},
};
use serde_json::json;
use tower::Service;

#[tokio::test]
#[serial_test::serial]
async fn require_auth_enabled_with_valid_token() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 1.into()),
            ("success:jawn:whoami", 1.into()),
            ("success:minio:upload_request", 1.into()),
            ("success:jawn:log_request", 1.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    let body_bytes = serde_json::to_vec(&json!({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Hello, world!"
            }
        ]
    }))
    .unwrap();

    let request_body = axum_core::body::Body::from(body_bytes);
    let request = Request::builder()
        .method(Method::POST)
        .header("authorization", "Bearer sk-helicone-test-key")
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    // we need to collect the body here in order to poll the underlying body
    // so that the async logging task can complete
    let _response_body = response.into_body().collect().await.unwrap();

    // sleep so that the background task for logging can complete
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    // mocks are verified on drop
}

#[tokio::test]
#[serial_test::serial]
async fn require_auth_enabled_without_token() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            // Request should be rejected at auth layer, so no services should
            // be called
            ("success:openai:chat_completion", 0.into()),
            ("success:anthropic:messages", 0.into()),
            ("success:jawn:whoami", 0.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    let body_bytes = serde_json::to_vec(&json!({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Hello, world!"
            }
        ]
    }))
    .unwrap();

    let request_body = axum_core::body::Body::from(body_bytes);
    let request = Request::builder()
        .method(Method::POST)
        // Missing authorization header
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

    // mocks are verified on drop
}

#[tokio::test]
#[serial_test::serial]
async fn require_auth_disabled_without_token() {
    let mut config = Config::test_default();
    config.auth.require_auth = false;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 1.into()),
            // Auth is disabled, so auth and logging services should not be
            // called
            ("success:jawn:whoami", 0.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    let body_bytes = serde_json::to_vec(&json!({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Hello, world!"
            }
        ]
    }))
    .unwrap();

    let request_body = axum_core::body::Body::from(body_bytes);
    let request = Request::builder()
        .method(Method::POST)
        // No authorization header, but auth is disabled
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // mocks are verified on drop
}

#[tokio::test]
#[serial_test::serial]
async fn require_auth_disabled_with_token() {
    let mut config = Config::test_default();
    config.auth.require_auth = false;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 1.into()),
            // Auth is disabled, so auth and logging services should not be
            // called
            ("success:jawn:whoami", 0.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    let body_bytes = serde_json::to_vec(&json!({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Hello, world!"
            }
        ]
    }))
    .unwrap();

    let request_body = axum_core::body::Body::from(body_bytes);
    let request = Request::builder()
        .method(Method::POST)
        .header("authorization", "Bearer sk-helicone-test-key")
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    // mocks are verified on drop
}
