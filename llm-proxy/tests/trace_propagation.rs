use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use llm_proxy::{
    config::{
        Config,
        balance::BalanceConfig,
        router::{RouterConfig, RouterConfigs},
    },
    tests::{TestDefault, harness::Harness, mock::MockArgs},
    types::{provider::InferenceProvider, router::RouterId},
};
use serde_json::json;
use tower::Service;

/// Sending a request to https://localhost/router should
/// result in the proxied request targeting https://api.openai.com/v1/chat/completions
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn openai() {
    let config = Config::test_default();
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([(
            "success:openai:chat_completion",
            1.into(),
        )]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;
    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, world!"
                }
            ]
        }))
        .unwrap(),
    );

    let request_id = "00000000000000000000000000000000";
    let request = Request::builder()
        .method(Method::POST)
        // default router
        .uri("http://router.helicone.com/router/v1/chat/completions")
        .header("traceparent", format!("00-{}-7a085853722dc6d2-00", request_id, request_id))
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.headers().get("x-request-id").unwrap(), request_id);

    // technically verification happens on drop but we do it here to be explicit
    harness.mock.openai_mock.verify().await;
}
