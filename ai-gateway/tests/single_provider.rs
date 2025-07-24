use crate::tests::harness::{Harness, MockArgs};
use crate::config::{Config, RouterConfigs, RouterConfig, BalanceConfig, HeliconeFeatures};
use crate::router::RouterId;
use axum::http::{Method, StatusCode};
use axum_core::body::Body;
use hyper::Request;
use serde_json::json;
use std::collections::HashMap;

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn openai() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.helicone.features = HeliconeFeatures::None;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::openai(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
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
        .uri("http://router.helicone.com/router/default/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn anthropic() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.helicone.features = HeliconeFeatures::None;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::anthropic(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
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
        // default router
        .uri("http://router.helicone.com/router/default/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn gemini() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.helicone.features = HeliconeFeatures::None;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::gemini(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:gemini:generate_content", 1.into()),
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
            "model": "gemini/gemini-1.5-flash",
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
        .uri("http://router.helicone.com/router/default/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn ollama_with_openai_request_style() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.helicone.features = HeliconeFeatures::None;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::ollama(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:ollama:chat_completion", 1.into()),
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
            "model": "ollama/llama3.2",
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
        .uri("http://router.helicone.com/router/default/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn bedrock_with_openai_request_style() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.helicone.features = HeliconeFeatures::None;
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
            ("success:bedrock:invoke_model", 1.into()),
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
            "model": "bedrock/us.anthropic.claude-3-5-haiku-20241022-v1:0",
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
        .uri("http://router.helicone.com/router/default/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn mistral() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.helicone.features = HeliconeFeatures::None;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::mistral(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
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
        // default router
        .uri("http://router.helicone.com/router/default/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[serial_test::serial(default_mock)]
async fn nvidia_dynamo() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic provider
    // functionality
    config.helicone.features = HeliconeFeatures::None;
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::nvidia_dynamo(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;
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
        // default router
        .uri("http://router.helicone.com/router/default/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}