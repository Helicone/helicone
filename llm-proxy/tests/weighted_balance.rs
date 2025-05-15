use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use llm_proxy::{
    config::{
        Config,
        balance::{BalanceConfig, BalanceConfigInner, BalanceTarget},
        router::{RouterConfig, RouterConfigs},
    },
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
async fn weighted_balancer_anthropic_preferred() {
    let mut config = Config::test_default();
    let balance_config = BalanceConfig::from(HashMap::from([(
        EndpointType::Chat,
        BalanceConfigInner::Weighted {
            targets: nes![
                BalanceTarget {
                    provider: InferenceProvider::OpenAI,
                    weight: Decimal::try_from(0.25).unwrap(),
                },
                BalanceTarget {
                    provider: InferenceProvider::Anthropic,
                    weight: Decimal::try_from(0.75).unwrap(),
                },
            ],
        },
    )]));
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            balance: balance_config,
            ..Default::default()
        },
    )]));
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (15..35).into()),
            ("success:anthropic:messages", (65..85).into()),
            ("success:minio:upload_request", 100.into()),
            ("success:jawn:log_request", 100.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;
    let num_requests = 100;
    let body_bytes = serde_json::to_vec(&json!({
        "model": "gpt-4o-mini",
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
            // default router
            .uri("http://router.helicone.com/router/v1/chat/completions")
            .body(request_body)
            .unwrap();
        let response = harness.call(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
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

    harness.mock.jawn_mock.verify().await;
    harness.mock.minio_mock.verify().await;
    harness.mock.openai_mock.verify().await;
    harness.mock.anthropic_mock.verify().await;
}

#[tokio::test]
#[serial_test::serial]
async fn weighted_balancer_openai_preferred() {
    let mut config = Config::test_default();
    let balance_config = BalanceConfig::from(HashMap::from([(
        EndpointType::Chat,
        BalanceConfigInner::Weighted {
            targets: nes![
                BalanceTarget {
                    provider: InferenceProvider::OpenAI,
                    weight: Decimal::try_from(0.75).unwrap(),
                },
                BalanceTarget {
                    provider: InferenceProvider::Anthropic,
                    weight: Decimal::try_from(0.25).unwrap(),
                },
            ],
        },
    )]));
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            balance: balance_config,
            ..Default::default()
        },
    )]));
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (65..85).into()),
            ("success:anthropic:messages", (15..35).into()),
            ("success:minio:upload_request", 100.into()),
            ("success:jawn:log_request", 100.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;
    let num_requests = 100;
    let body_bytes = serde_json::to_vec(&json!({
        "model": "gpt-4o-mini",
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
            // default router
            .uri("http://router.helicone.com/router/v1/chat/completions")
            .body(request_body)
            .unwrap();
        let response = harness.call(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
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

    harness.mock.jawn_mock.verify().await;
    harness.mock.minio_mock.verify().await;
    harness.mock.openai_mock.verify().await;
    harness.mock.anthropic_mock.verify().await;
}

#[tokio::test]
#[serial_test::serial]
async fn weighted_balancer_anthropic_heavily_preferred() {
    let mut config = Config::test_default();
    let balance_config = BalanceConfig::from(HashMap::from([(
        EndpointType::Chat,
        BalanceConfigInner::Weighted {
            targets: nes![
                BalanceTarget {
                    provider: InferenceProvider::OpenAI,
                    weight: Decimal::try_from(0.05).unwrap(),
                },
                BalanceTarget {
                    provider: InferenceProvider::Anthropic,
                    weight: Decimal::try_from(0.95).unwrap(),
                },
            ],
        },
    )]));
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            balance: balance_config,
            ..Default::default()
        },
    )]));
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (1..10).into()),
            ("success:anthropic:messages", (80..100).into()),
            ("success:minio:upload_request", 100.into()),
            ("success:jawn:log_request", 100.into()),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;
    let num_requests = 100;
    let body_bytes = serde_json::to_vec(&json!({
        "model": "gpt-4o-mini",
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
            // default router
            .uri("http://router.helicone.com/router/v1/chat/completions")
            .body(request_body)
            .unwrap();
        let response = harness.call(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
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

    harness.mock.jawn_mock.verify().await;
    harness.mock.minio_mock.verify().await;
    harness.mock.openai_mock.verify().await;
    harness.mock.anthropic_mock.verify().await;
}
