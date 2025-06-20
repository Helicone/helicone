use std::collections::HashMap;

use ai_gateway::{
    config::{
        Config,
        balance::BalanceConfig,
        router::{RouterConfig, RouterConfigs},
    },
    tests::{TestDefault, harness::Harness, mock::MockArgs},
    types::router::RouterId,
};
use http::{Method, Request, StatusCode};
use serde_json::json;
use tower::Service;

/// Test that requests are properly passed through to the OpenAI provider
/// using the fake endpoint stub
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn openai_passthrough() {
    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic passthrough
    // functionality
    config.helicone_observability.enable_auth = false;

    // Configure router to use OpenAI as the only provider
    let router_config = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            load_balance: BalanceConfig::openai_chat(),
            ..Default::default()
        },
    )]));
    config.routers = router_config;

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
        .uri("http://router.helicone.com/router/default/v1/fake_endpoint")
        .header("content-type", "application/json")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // Verify the mock was called as expected
    harness.mock.verify().await;
}
