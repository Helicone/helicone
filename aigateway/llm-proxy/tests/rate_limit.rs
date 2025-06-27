use std::collections::HashMap;

use http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use llm_proxy::{
    config::{Config, rate_limit::GlobalRateLimitConfig},
    control_plane::types::{Key, hash_key},
    tests::{TestDefault, harness::Harness, mock::MockArgs},
};
use serde_json::json;
use tower::Service;
use uuid::Uuid;

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

async fn rate_limit_capacity_enforced_impl(
    rate_limit_config: GlobalRateLimitConfig,
) {
    let mut config = Config::test_default();
    config.helicone.enable_auth = true;
    config.global.rate_limit = Some(rate_limit_config);
    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 6.into()),
            ("success:minio:upload_request", 6.into()),
            ("success:jawn:log_request", 6.into()),
            ("success:jawn:sign_s3_url", 6.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    for i in 1..=3 {
        let response = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "Request {i} should succeed"
        );
        let _body = response.into_body().collect().await.unwrap();
    }

    let response = make_chat_request(&mut harness, auth_header).await;
    let status = response.status();
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "4th request should be rate limited"
    );

    let retry_after = response.headers().get("retry-after");
    assert!(
        retry_after.is_some(),
        "retry-after header should be present"
    );
    let _body = response.into_body().collect().await.unwrap();

    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    for i in 1..=3 {
        let response = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "Request {i} should succeed"
        );
        let _body = response.into_body().collect().await.unwrap();
    }

    let response = make_chat_request(&mut harness, auth_header).await;
    let status = response.status();
    assert_eq!(status, StatusCode::TOO_MANY_REQUESTS,);

    let retry_after = response.headers().get("retry-after");
    assert!(
        retry_after.is_some(),
        "retry-after header should be present"
    );
    let _body = response.into_body().collect().await.unwrap();
}

async fn rate_limit_per_user_isolation_impl(
    rate_limit_config: GlobalRateLimitConfig,
) {
    let mut config = Config::test_default();
    config.helicone.enable_auth = true;
    config.global.rate_limit = Some(rate_limit_config);

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 3.into()),
            ("success:minio:upload_request", 3.into()),
            ("success:jawn:log_request", 3.into()),
            ("success:jawn:sign_s3_url", 3.into()),
        ]))
        .build();

    let user1_auth = "sk-helicone-user1-key";
    let user2_auth = "sk-helicone-user2-key";
    let user1_id = Uuid::new_v4();
    let user2_id = Uuid::new_v4();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_auth_keys(vec![
            Key {
                key_hash: hash_key(user1_auth),
                owner_id: user1_id.to_string(),
            },
            Key {
                key_hash: hash_key(user2_auth),
                owner_id: user2_id.to_string(),
            },
        ])
        .build()
        .await;

    for i in 1..=3 {
        let response =
            make_chat_request(&mut harness, &format!("Bearer {user1_auth}"))
                .await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "User1 request {i} should succeed"
        );
        let _body = response.into_body().collect().await.unwrap();
    }

    let response =
        make_chat_request(&mut harness, &format!("Bearer {user1_auth}")).await;
    assert_eq!(
        response.status(),
        StatusCode::TOO_MANY_REQUESTS,
        "User1 should be rate limited"
    );

    let retry_after = response.headers().get("retry-after");
    assert!(
        retry_after.is_some(),
        "retry-after header should be present"
    );
    let _body = response.into_body().collect().await.unwrap();

    harness.mock.verify().await;
    harness.mock.reset().await;
    harness
        .mock
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 3.into()),
            ("success:minio:upload_request", 3.into()),
            ("success:jawn:log_request", 3.into()),
            ("success:jawn:sign_s3_url", 3.into()),
        ]))
        .await;

    for i in 1..=3 {
        let response = make_chat_request(&mut harness, user2_auth).await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "User2 request {i} should succeed"
        );
        let _body = response.into_body().collect().await.unwrap();
    }
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
}

#[tokio::test]
#[serial_test::serial]
async fn rate_limit_disabled() {
    let mut config = Config::test_default();
    config.helicone.enable_auth = true;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 10.into()),
            ("success:minio:upload_request", 10.into()),
            ("success:jawn:log_request", 10.into()),
            ("success:jawn:sign_s3_url", 10.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    for i in 1..=10 {
        let response = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "Request {i} should succeed when rate limiting disabled"
        );
        let _body = response.into_body().collect().await.unwrap();
    }
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
}

async fn make_chat_request(
    harness: &mut Harness,
    auth_header: &str,
) -> http::Response<
    tower_http::body::UnsyncBoxBody<
        bytes::Bytes,
        Box<dyn std::error::Error + Send + Sync + 'static>,
    >,
> {
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
        .uri("http://router.helicone.com/router/default/v1/chat/completions")
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();

    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    response
}
