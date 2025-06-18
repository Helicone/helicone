use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use llm_proxy::{
    config::Config,
    tests::{TestDefault, harness::Harness, mock::MockArgs},
};
use serde_json::json;
use tower::Service;

/// Test that requests are properly passed through to the OpenAI provider
/// when using the /{provider} base url.
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn openai_direct_proxy() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic passthrough
    // functionality
    config.helicone.enable_auth = false;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:fake_endpoint", 1.into()),
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
            "test": "data"
        }))
        .unwrap(),
    );

    let request = Request::builder()
        .method(Method::POST)
        // Route to the fake endpoint through the default router
        .uri("http://router.helicone.com/openai/v1/fake_endpoint")
        .header("content-type", "application/json")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

/// Test that requests are properly passed through to the Anthropic provider
/// when using the /{provider} base url.
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn anthropic_direct_proxy() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic passthrough
    // functionality
    config.helicone.enable_auth = false;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:anthropic:fake_endpoint", 1.into()),
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
            "test": "data"
        }))
        .unwrap(),
    );

    let request = Request::builder()
        .method(Method::POST)
        // Route to the fake endpoint through the default router
        .uri("http://router.helicone.com/anthropic/v1/fake_endpoint")
        .header("content-type", "application/json")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}
