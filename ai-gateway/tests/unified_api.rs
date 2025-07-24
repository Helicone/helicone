use crate::tests::harness::{Harness, MockArgs};
use crate::config::{Config, HeliconeFeatures};
use axum::http::{Method, StatusCode};
use axum_core::body::Body;
use hyper::Request;
use serde_json::json;
use std::collections::HashMap;

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn openai_unified_api() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic passthrough
    // functionality
    config.helicone.features = HeliconeFeatures::None;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 1.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "openai/gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, world!"
                }
            ]
        }))
        .unwrap(),
    );

    let request = Request::builder()
        .method(Method::POST)
        // Route to the fake endpoint through the default router
        .uri("http://router.helicone.com/ai/chat/completions")
        .header("content-type", "application/json")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn anthropic_unified_api() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic passthrough
    // functionality
    config.helicone.features = HeliconeFeatures::None;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:anthropic:messages", 1.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "anthropic/claude-3-5-haiku",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, world!"
                }
            ]
        }))
        .unwrap(),
    );

    let request = Request::builder()
        .method(Method::POST)
        // Route to the fake endpoint through the default router
        .uri("http://router.helicone.com/ai/chat/completions")
        .header("content-type", "application/json")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn mistral_unified_api() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic passthrough
    // functionality
    config.helicone.features = HeliconeFeatures::None;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:mistral:chat_completion", 1.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "mistral/mistral-large-latest",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, world!"
                }
            ]
        }))
        .unwrap(),
    );

    let request = Request::builder()
        .method(Method::POST)
        // Route to the fake endpoint through the default router
        .uri("http://router.helicone.com/ai/chat/completions")
        .header("content-type", "application/json")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn nvidia_dynamo_unified_api() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic passthrough
    // functionality
    config.helicone.features = HeliconeFeatures::None;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:nvidia-dynamo:chat_completion", 1.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "nvidia-dynamo/nvidia/llama3.1-70b",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, world!"
                }
            ]
        }))
        .unwrap(),
    );

    let request = Request::builder()
        .method(Method::POST)
        // Route to the fake endpoint through the default router
        .uri("http://router.helicone.com/ai/chat/completions")
        .header("content-type", "application/json")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}