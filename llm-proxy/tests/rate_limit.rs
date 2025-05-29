use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use llm_proxy::{
    config::{Config, rate_limit::RateLimitConfig},
    tests::{TestDefault, harness::Harness, mock::MockArgs},
};
use serde_json::json;
use stubr::wiremock_rs::{Mock, ResponseTemplate, matchers};
use tower::Service;
use uuid::Uuid;

// Redis-based rate limiter tests
#[tokio::test]
#[serial_test::serial]
async fn rate_limit_capacity_enforced_redis() {
    rate_limit_capacity_enforced_impl(
        llm_proxy::config::rate_limit::enabled_for_test_redis(),
    )
    .await;
}

#[tokio::test]
#[serial_test::serial]
async fn rate_limit_per_user_isolation_redis() {
    rate_limit_per_user_isolation_impl(
        llm_proxy::config::rate_limit::enabled_for_test_redis(),
    )
    .await;
}

// In-memory rate limiter tests
#[tokio::test]
#[serial_test::serial]
async fn rate_limit_capacity_enforced_in_memory() {
    rate_limit_capacity_enforced_impl(
        llm_proxy::config::rate_limit::enabled_for_test_in_memory(),
    )
    .await;
}

#[tokio::test]
#[serial_test::serial]
async fn rate_limit_per_user_isolation_in_memory() {
    rate_limit_per_user_isolation_impl(
        llm_proxy::config::rate_limit::enabled_for_test_in_memory(),
    )
    .await;
}

// Parameterized test implementations
async fn rate_limit_capacity_enforced_impl(rate_limit_config: RateLimitConfig) {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = rate_limit_config;
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 6.into()),
            ("success:minio:upload_request", 6.into()),
            ("success:jawn:log_request", 6.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    harness
        .mock
        .jawn_mock
        .http_server
        .register(whoami_mock())
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    // Make 5 requests - should all succeed (capacity = 5)
    for i in 1..=5 {
        let status = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(status, StatusCode::OK, "Request {} should succeed", i);
    }

    // 6th request should be rate limited
    let status = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "6th request should be rate limited"
    );

    // Sleep to allow the rate limit to refill
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    // 7th request should succeed
    let status = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        status,
        StatusCode::OK,
        "7th request should succeed after refill"
    );

    // 8th request should be rate limited
    let status = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "8th request should be rate limited"
    );

    let whoami_received_req = harness
        .mock
        .jawn_mock
        .http_server
        .received_requests_for("GET", "/v1/router/control-plane/whoami")
        .await
        .unwrap();
    assert_eq!(
        whoami_received_req.len(),
        8,
        "8 whoami requests should have been received"
    );
    // mocks are verified on drop
}

async fn rate_limit_per_user_isolation_impl(
    rate_limit_config: RateLimitConfig,
) {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = rate_limit_config;

    // Set up mocks - expect requests from both users
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 5.into()),
            ("success:minio:upload_request", 5.into()),
            ("success:jawn:log_request", 5.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    let user1_auth = "Bearer sk-helicone-user1-key";
    let user2_auth = "Bearer sk-helicone-user2-key";
    harness
        .mock
        .jawn_mock
        .http_server
        .register(whoami_mock())
        .await;

    // Exhaust user1's rate limit
    for i in 1..=5 {
        let status = make_chat_request(&mut harness, user1_auth).await;
        assert_eq!(
            status,
            StatusCode::OK,
            "User1 request {} should succeed",
            i
        );
    }

    // User1's next request should be rate limited
    let status = make_chat_request(&mut harness, user1_auth).await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "User1 should be rate limited"
    );

    let whoami_received_req = harness
        .mock
        .jawn_mock
        .http_server
        .received_requests_for("GET", "/v1/router/control-plane/whoami")
        .await
        .unwrap();
    assert_eq!(
        whoami_received_req.len(),
        6,
        "6 whoami requests should have been received"
    );

    harness.mock.verify().await;
    harness.mock.reset().await;
    harness
        .mock
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 5.into()),
            ("success:minio:upload_request", 5.into()),
            ("success:jawn:log_request", 5.into()),
        ]))
        .await;
    harness
        .mock
        .jawn_mock
        .http_server
        .register(whoami_mock())
        .await;

    // User2 should still have full capacity available
    for i in 1..=5 {
        let status = make_chat_request(&mut harness, user2_auth).await;
        assert_eq!(
            status,
            StatusCode::OK,
            "User2 request {} should succeed",
            i
        );
    }

    let whoami_received_req = harness
        .mock
        .jawn_mock
        .http_server
        .received_requests_for("GET", "/v1/router/control-plane/whoami")
        .await
        .unwrap();
    assert_eq!(
        whoami_received_req.len(),
        5,
        "5 whoami requests should have been received"
    );
    // mocks are verified on drop
}

#[tokio::test]
#[serial_test::serial]
async fn rate_limit_disabled() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    // rate_limit defaults to disabled in test config

    // Set up mocks - many requests should succeed when rate limiting is
    // disabled
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 10.into()),
            ("success:minio:upload_request", 10.into()),
            ("success:jawn:log_request", 10.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;
    harness
        .mock
        .jawn_mock
        .http_server
        .register(whoami_mock())
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    // Make many requests - all should succeed when rate limiting is disabled
    for i in 1..=10 {
        let status = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            status,
            StatusCode::OK,
            "Request {} should succeed when rate limiting disabled",
            i
        );
    }

    let whoami_received_req = harness
        .mock
        .jawn_mock
        .http_server
        .received_requests_for("GET", "/v1/router/control-plane/whoami")
        .await
        .unwrap();
    assert_eq!(
        whoami_received_req.len(),
        10,
        "10 whoami requests should have been received"
    );

    // mocks are verified on drop
}

async fn make_chat_request(
    harness: &mut Harness,
    auth_header: &str,
) -> http::StatusCode {
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

    let request_body = axum_core::body::Body::from(body_bytes);
    let request = Request::builder()
        .method(Method::POST)
        .header("authorization", auth_header)
        .uri("http://router.helicone.com/router/v1/chat/completions")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    let status = response.status();

    // Collect the body and sleep to ensure async logging completes
    let _response_body = response.into_body().collect().await.unwrap();
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    status
}

fn whoami_mock() -> Mock {
    let matcher = matchers::path("/v1/router/control-plane/whoami");
    let response = ResponseTemplate::new(200)
        .append_header("content-type", "application/json")
        .set_body_json(json!({
            "userId": Uuid::new_v4().to_string(),
            "organizationId": Uuid::new_v4().to_string()
        }));
    Mock::given(matcher).respond_with(response)
}
