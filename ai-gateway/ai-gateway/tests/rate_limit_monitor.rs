use std::collections::HashMap;

use ai_gateway::{
    config::{
        Config,
        balance::{BalanceConfig, BalanceConfigInner, BalanceTarget},
        router::{RouterConfig, RouterConfigs},
    },
    discover::monitor::rate_limit::RateLimitMonitor,
    endpoints::EndpointType,
    tests::{TestDefault, harness::Harness, mock::MockArgs},
    types::{provider::InferenceProvider, router::RouterId},
};
use http::{Method, Request};
use http_body_util::BodyExt;
use nonempty_collections::nes;
use rust_decimal::Decimal;
use serde_json::json;
use tower::Service;

#[tokio::test]
#[serial_test::serial]
async fn rate_limit_removes_provider_from_lb_pool() {
    let mut config = Config::test_default();
    // Enable auth so that logging services are called
    config.helicone_observability.enable_auth = true;
    let balance_config = BalanceConfig::from(HashMap::from([(
        EndpointType::Chat,
        BalanceConfigInner::Weighted {
            providers: nes![
                BalanceTarget {
                    provider: InferenceProvider::OpenAI,
                    weight: Decimal::try_from(0.50).unwrap(),
                },
                BalanceTarget {
                    provider: InferenceProvider::Anthropic,
                    weight: Decimal::try_from(0.50).unwrap(),
                },
            ],
        },
    )]));
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: balance_config,
            ..Default::default()
        },
    )]));

    // Set up mock args where OpenAI returns 429 rate limit errors
    // and Anthropic returns success
    let num_requests = 20;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("rate_limit:openai:chat_completion", 1.into()),
            ("success:anthropic:messages", (num_requests - 1..).into()),
            ("success:minio:upload_request", num_requests.into()),
            ("success:jawn:log_request", num_requests.into()),
            ("success:jawn:sign_s3_url", num_requests.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;

    // Start the rate limit monitor before making requests
    // It will poll for new monitors every 100ms in test mode
    let rate_limit_monitor =
        RateLimitMonitor::new(harness.app_factory.state.clone());
    tokio::spawn(async move {
        rate_limit_monitor.run_forever().await.unwrap();
    });
    // Give time for the monitor to pick up the new router (polls every 100ms in
    // test mode)
    tokio::time::sleep(std::time::Duration::from_millis(150)).await;

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

    // Make an initial request to ensure the router is initialized
    // This will create the rate limit channels and the monitor will pick them
    // up
    for _ in 0..num_requests {
        let request_body = axum_core::body::Body::from(body_bytes.clone());
        let request = Request::builder()
            .method(Method::POST)
            .header("authorization", "Bearer sk-helicone-test-key")
            .uri(
                "http://router.helicone.com/router/default/v1/chat/completions",
            )
            .body(request_body)
            .unwrap();
        let response = harness.call(request).await.unwrap();
        let _response_body = response.into_body().collect().await.unwrap();
    }

    // sleep to allow the provider to be re-added after the retry-after period
    tokio::time::sleep(std::time::Duration::from_secs(4)).await;
    tracing::info!("Verifying mock stubs");
    harness.mock.verify().await;
    harness.mock.reset().await;
    // reset stubs so that openai is no longer returning 429s
    harness
        .mock
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (6..=14).into()),
            ("success:anthropic:messages", (6..=14).into()),
            ("success:minio:upload_request", 20.into()),
            ("success:jawn:log_request", 20.into()),
            ("success:jawn:sign_s3_url", 20.into()),
        ]))
        .await;

    for _ in 0..20 {
        let request_body = axum_core::body::Body::from(body_bytes.clone());
        let request = Request::builder()
            .method(Method::POST)
            .header("authorization", "Bearer sk-helicone-test-key")
            .uri(
                "http://router.helicone.com/router/default/v1/chat/completions",
            )
            .body(request_body)
            .unwrap();
        let response = harness.call(request).await.unwrap();
        let _response_body = response.into_body().collect().await.unwrap();
    }

    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
}
