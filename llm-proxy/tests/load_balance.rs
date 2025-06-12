use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use llm_proxy::{
    config::{
        Config,
        balance::{BalanceConfig, BalanceConfigInner},
        router::{RouterConfig, RouterConfigs},
    },
    endpoints::EndpointType,
    tests::{TestDefault, harness::Harness, mock::MockArgs},
    types::{provider::InferenceProvider, router::RouterId},
};
use nonempty_collections::nes;
use serde_json::json;
use tower::Service;

fn p2c_config_openai_anthropic_google() -> RouterConfigs {
    RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            request_style: InferenceProvider::OpenAI,
            load_balance: BalanceConfig(HashMap::from([(
                EndpointType::Chat,
                BalanceConfigInner::Latency {
                    targets: nes![
                        InferenceProvider::OpenAI,
                        InferenceProvider::Anthropic,
                        InferenceProvider::GoogleGemini
                    ],
                },
            )])),
            model_mappings: None,
            cache: None,
            retries: None,
            rate_limit: Default::default(),
            spend_control: None,
        },
    )]))
}

#[tokio::test]
#[serial_test::serial]
async fn openai_slow() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing load balancing behavior
    config.auth.require_auth = false;
    // Use p2c balance config with OpenAI, Anthropic, and Google providers
    config.routers = p2c_config_openai_anthropic_google();
    let latency = 100;
    let requests = 100;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (..40).into()),
            ("success:anthropic:messages", (30..).into()),
            ("success:google:generate_content", (30..).into()),
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
        "model": "openai/gpt-4o-mini",
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
            .uri(
                "http://router.helicone.com/router/default/v1/chat/completions",
            )
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
    // Use p2c balance config with OpenAI, Anthropic, and Google providers
    config.routers = p2c_config_openai_anthropic_google();
    let latency = 10;
    let requests = 100;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (30..).into()),
            ("success:anthropic:messages", (..60).into()),
            ("success:google:generate_content", (..60).into()),
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
        "model": "openai/gpt-4o-mini",
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
            .uri(
                "http://router.helicone.com/router/default/v1/chat/completions",
            )
            .body(request_body)
            .unwrap();
        let response = harness.call(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
}
