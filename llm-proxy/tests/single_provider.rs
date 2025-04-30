use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use llm_proxy::{
    config::{
        Config,
        router::{BalanceConfig, RouterConfig, RouterConfigs},
    },
    tests::{TestDefault, harness::Harness},
    types::{provider::Provider, router::RouterId},
};
use nonempty_collections::nev;
use serde_json::json;
use tower::Service;

/// Sending a request to https://localhost/router should
/// result in the proxied request targeting https://api.openai.com/v1/chat/completions
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn openai() {
    let config = Config::test_default();
    let mut harness = Harness::builder().with_config(config).build().await;
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
    let request = Request::builder()
        .method(Method::POST)
        // default router
        .uri("http://router.helicone.com/router/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // assert that the request was proxied to the mock server correctly
    let received_requests = harness
        .mock
        .openai_mock
        .received_requests_for("POST", "/v1/chat/completions")
        .await
        .expect("no requests received");
    assert_eq!(received_requests.len(), 1);
}

/// Sending a request to https://localhost/router should
/// result in the proxied request targeting https://api.openai.com/v1/chat/completions
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn anthropic() {
    let mut config = Config::test_default();
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            request_style: Provider::OpenAI,
            providers: nev![Provider::Anthropic],
            cache: None,
            fallback: None,
            balance: BalanceConfig::P2C {
                targets: nev![Provider::Anthropic],
            },
            retries: None,
            rate_limit: None,
            spend_control: None,
        },
    )]));
    config.routers = router_config;
    let mut harness = Harness::builder().with_config(config).build().await;
    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "claude-3-5-sonnet-20240620",
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
        .uri("http://router.helicone.com/router/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // assert that the request was proxied to the mock server correctly
    let received_requests = harness
        .mock
        .anthropic_mock
        .received_requests_for("POST", "/v1/messages")
        .await
        .expect("no requests received");
    assert_eq!(received_requests.len(), 1);

    // test that using an openai model name works as well
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
    let request = Request::builder()
        .method(Method::POST)
        // default router
        .uri("http://router.helicone.com/router/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // assert that the request was proxied to the mock server correctly
    let received_requests = harness
        .mock
        .anthropic_mock
        .received_requests_for("POST", "/v1/messages")
        .await
        .expect("no requests received");
    assert_eq!(received_requests.len(), 2);
}

/// Sending a request to https://localhost/router should
/// result in the proxied request targeting https://api.openai.com/v1/chat/completions
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn anthropic_request_style() {
    let mut config = Config::test_default();
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            request_style: Provider::Anthropic,
            providers: nev![Provider::OpenAI],
            cache: None,
            fallback: None,
            balance: BalanceConfig::P2C {
                targets: nev![Provider::OpenAI],
            },
            retries: None,
            rate_limit: None,
            spend_control: None,
        },
    )]));
    config.routers = router_config;
    let mut harness = Harness::builder().with_config(config).build().await;
    let request_body = axum_core::body::Body::from(
        serde_json::to_vec(&json!({
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, world!"
                }
            ],
            "max_tokens": 100
        }))
        .unwrap(),
    );
    let request = Request::builder()
        .method(Method::POST)
        // default router
        .uri("http://router.helicone.com/router/v1/messages")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // assert that the request was proxied to the mock server correctly
    let received_requests = harness
        .mock
        .openai_mock
        .received_requests_for("POST", "/v1/chat/completions")
        .await
        .expect("no requests received");
    assert_eq!(received_requests.len(), 1);
}
