use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use llm_proxy::{
    config::{
        Config,
        balance::BalanceConfig,
        router::{RouterConfig, RouterConfigs},
    },
    tests::{TestDefault, harness::Harness, mock::MockArgs},
    types::router::RouterId,
};
use serde_json::json;
use tower::Service;

/// Sending a request to https://localhost/router should
/// result in the proxied request targeting https://api.openai.com/v1/chat/completions
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn openai() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.auth.require_auth = false;
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
        // default router
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

/// Sending a request to https://localhost/router should
// result in the proxied request targeting https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn google_with_openai_request_style() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.auth.require_auth = false;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::google_gemini(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:google:generate_content", 2.into()),
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
            "model": "gemini/gemini-2.0-flash",
            "messages": [
                {"role": "user", "content": "Explain to me how AI works"}
            ],
        }))
        .unwrap(),
    );
    let request = Request::builder()
        .method(Method::POST)
        // default router
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "openai/gpt-4o-mini",
            "messages": [
                {"role": "user", "content": "Explain to me how AI works"}
            ]
        }))
        .unwrap(),
    );
    let request = Request::builder()
        .method(Method::POST)
        // default router
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

/// Sending a request to https://localhost/router should
/// result in the proxied request targeting https://api.openai.com/v1/chat/completions
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn anthropic_with_openai_request_style() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.auth.require_auth = false;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::anthropic_chat(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:anthropic:messages", 2.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;
    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "anthropic/claude-3-5-sonnet-latest",
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
        // default router
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // test that using an openai model name works as well
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
        // default router
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

/// Sending a request to https://localhost/router should
/// result in the proxied request targeting Ollama chat completions endpoint
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn ollama() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.auth.require_auth = false;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::ollama_chat(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:ollama:chat_completions", 1.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;
    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "ollama/llama3",
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
        // default router
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

/// Sending a request to https://localhost/router should
/// result in the proxied request targeting Bedrock converse endpoint
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn bedrock_with_openai_request_style() {
    let mut config = Config::test_default();
    config.auth.require_auth = false;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::bedrock(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:bedrock:converse", 1.into()),
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
    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0",
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
        // default router
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}
