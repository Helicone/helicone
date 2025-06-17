use std::collections::HashMap;

use http::{Method, Request};
use http_body_util::BodyExt;
use llm_proxy::{
    config::{
        Config,
        balance::{BalanceConfig, BalanceConfigInner, BalanceTarget},
        router::{RouterConfig, RouterConfigs},
    },
    discover::monitor::health::HealthMonitor,
    endpoints::EndpointType,
    tests::{TestDefault, harness::Harness, mock::MockArgs},
    types::{provider::InferenceProvider, router::RouterId},
};
use nonempty_collections::nes;
use rust_decimal::Decimal;
use serde_json::json;
use tower::Service;

#[tokio::test]
#[serial_test::serial]
async fn errors_remove_provider_from_lb_pool() {
    let mut config = Config::test_default();
    // Enable auth so that logging services are called
    config.auth.require_auth = true;
    let balance_config = BalanceConfig::from(HashMap::from([(
        EndpointType::Chat,
        BalanceConfigInner::Weighted {
            targets: nes![
                BalanceTarget {
                    provider: InferenceProvider::OpenAI,
                    weight: Decimal::try_from(0.20).unwrap(),
                },
                BalanceTarget {
                    provider: InferenceProvider::Anthropic,
                    weight: Decimal::try_from(0.40).unwrap(),
                },
                BalanceTarget {
                    provider: InferenceProvider::GoogleGemini,
                    weight: Decimal::try_from(0.40).unwrap(),
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
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (70..).into()),
            ("error:anthropic:messages", (..12).into()),
            ("error:google:generate_content", (..12).into()),
            ("success:minio:upload_request", 100.into()),
            ("success:jawn:log_request", 100.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_auth()
        .with_mock_args(mock_args)
        .build()
        .await;
    let health_monitor = HealthMonitor::new(harness.app_factory.state.clone());
    tokio::spawn(async move {
        health_monitor.run_forever().await.unwrap();
    });
    let num_requests = 100;
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

    for _ in 0..num_requests {
        let request_body = axum_core::body::Body::from(body_bytes.clone());
        let request = Request::builder()
            .method(Method::POST)
            .header("authorization", "Bearer sk-helicone-test-key")
            // default router
            .uri(
                "http://router.helicone.com/router/default/v1/chat/completions",
            )
            .body(request_body)
            .unwrap();
        let response = harness.call(request).await.unwrap();
        // we need to collect the body here in order to poll the underlying body
        // so that the async logging task can complete
        let _response_body = response.into_body().collect().await.unwrap();
    }

    // sleep so that the background task for logging can complete
    // the proper way to write this test without a sleep is to
    // test it at the dispatcher level by returning a handle
    // to the async task and awaiting it in the test.
    //
    // but this is totes good for now
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
}
