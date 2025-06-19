use std::{collections::HashMap, time::Duration};

use ai_gateway::{
    config::{
        Config,
        rate_limit::{
            GcraConfig, GlobalRateLimitConfig, LimitsConfig, RateLimitStore,
        },
        router::{RouterConfig, RouterConfigs, RouterRateLimitConfig},
    },
    tests::{TestDefault, harness::Harness, mock::MockArgs},
    types::router::RouterId,
};
use compact_str::CompactString;
use http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::json;
use tower::Service;

fn create_test_limits(capacity: u32, duration_ms: u64) -> LimitsConfig {
    LimitsConfig {
        per_api_key: GcraConfig {
            capacity: capacity.try_into().unwrap(),
            refill_frequency: Duration::from_millis(duration_ms),
        },
    }
}

fn create_router_config(rate_limit: RouterRateLimitConfig) -> RouterConfig {
    RouterConfig {
        rate_limit,
        load_balance: ai_gateway::config::balance::BalanceConfig::openai_chat(),
        ..Default::default()
    }
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

async fn make_chat_request_for_router(
    harness: &mut Harness,
    auth_header: &str,
    router_id: &RouterId,
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
    let uri = match router_id {
        RouterId::Named(name) => format!(
            "http://router.helicone.com/router/{name}/v1/chat/completions"
        ),
        RouterId::Default => {
            "http://router.helicone.com/router/default/v1/chat/completions"
                .to_string()
        }
    };

    let request_body = axum_core::body::Body::from(body_bytes);
    let request = Request::builder()
        .method(Method::POST)
        .header("authorization", auth_header)
        .uri(uri)
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();

    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    response
}

// Test 1: Global rate limiting with router that doesn't override
#[tokio::test]
#[serial_test::serial]
async fn test_global_rate_limit_with_router_none() {
    let mut config = Config::test_default();
    config.helicone.enable_auth = true;
    config.global.rate_limit = Some(GlobalRateLimitConfig {
        store: RateLimitStore::InMemory,
        // 3 requests per second
        limits: Some(create_test_limits(3, 1000)),
        cleanup_interval: Duration::from_secs(60),
    });

    // Router doesn't override rate limiting
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        create_router_config(RouterRateLimitConfig::None),
    )]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 3.into()),
            ("success:minio:upload_request", 3.into()),
            ("success:jawn:log_request", 3.into()),
            ("success:jawn:sign_s3_url", 3.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    // The user should be able to make 3 requests successfully (capacity = 3)
    for i in 1..=3 {
        let response = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "Request {i} should succeed"
        );
        let _body = response.into_body().collect().await.unwrap();
    }

    // The 4th request should be rate limited
    let response = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        response.status(),
        StatusCode::TOO_MANY_REQUESTS,
        "4th request should be rate limited"
    );

    let retry_after = response.headers().get("retry-after");
    assert!(
        retry_after.is_some(),
        "retry-after header should be present"
    );
    let _body = response.into_body().collect().await.unwrap();

    // The 5th request should also be rate limited
    let response = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        response.status(),
        StatusCode::TOO_MANY_REQUESTS,
        "5th request should be rate limited"
    );
    let _body = response.into_body().collect().await.unwrap();
}

// Test 3: RouterSpecific config with custom router limits
#[tokio::test]
#[serial_test::serial]
async fn test_router_specific_with_custom_limits() {
    let mut config = Config::test_default();
    config.helicone.enable_auth = true;
    config.global.rate_limit = Some(GlobalRateLimitConfig {
        store: RateLimitStore::InMemory,
        limits: None,
        cleanup_interval: Duration::from_secs(60),
    });

    // Router provides its own custom rate limits
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            rate_limit: RouterRateLimitConfig::Custom {
                limits: create_test_limits(2, 1000), // 2 requests per second
            },
            load_balance:
                ai_gateway::config::balance::BalanceConfig::openai_chat(),
            ..Default::default()
        },
    )]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 2.into()),
            ("success:minio:upload_request", 2.into()),
            ("success:jawn:log_request", 2.into()),
            ("success:jawn:sign_s3_url", 2.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    // Make 2 requests - should all succeed (capacity = 2)
    for i in 1..=2 {
        let response = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "Request {i} should succeed"
        );
        let _body = response.into_body().collect().await.unwrap();
    }

    // 3rd request should be rate limited
    let response = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        response.status(),
        StatusCode::TOO_MANY_REQUESTS,
        "3rd request should be rate limited"
    );
    let _body = response.into_body().collect().await.unwrap();
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
}

// Test 4: Global override with custom router limits
#[tokio::test]
#[serial_test::serial]
async fn test_global_with_custom_router_override() {
    let mut config = Config::test_default();
    config.helicone.enable_auth = true;
    config.global.rate_limit = Some(GlobalRateLimitConfig {
        store: RateLimitStore::InMemory,
        // 5 requests per second
        limits: Some(create_test_limits(5, 1000)),
        cleanup_interval: Duration::from_secs(60),
    });

    // Router overrides with stricter custom limits
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            rate_limit: RouterRateLimitConfig::Custom {
                limits: create_test_limits(2, 1000), /* 2 requests per second
                                                      * for this router */
            },
            load_balance:
                ai_gateway::config::balance::BalanceConfig::openai_chat(),
            ..Default::default()
        },
    )]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 2.into()),
            ("success:minio:upload_request", 2.into()),
            ("success:jawn:log_request", 2.into()),
            ("success:jawn:sign_s3_url", 2.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    // Make 2 requests - should all succeed (router capacity = 2)
    for i in 1..=2 {
        let response = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "Request {i} should succeed"
        );
        let _body = response.into_body().collect().await.unwrap();
    }

    // 3rd request should be rate limited by router config, not global
    let response = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        response.status(),
        StatusCode::TOO_MANY_REQUESTS,
        "3rd request should be rate limited by router config"
    );
    let _body = response.into_body().collect().await.unwrap();
}

// Test 8: Router independence - verify that rate limits are applied per-router
#[tokio::test]
#[serial_test::serial]
async fn test_router_independence_different_rate_limits() {
    let mut config = Config::test_default();
    config.helicone.enable_auth = true;
    config.global.rate_limit = Some(GlobalRateLimitConfig {
        store: RateLimitStore::InMemory,
        limits: None,
        cleanup_interval: Duration::from_secs(60),
    });

    let strict_router_id = RouterId::Named(CompactString::from("strict"));
    let lenient_router_id = RouterId::Named(CompactString::from("lenient"));

    // Create two routers with different rate limits
    config.routers = RouterConfigs::new(HashMap::from([
        (
            strict_router_id.clone(),
            RouterConfig {
                rate_limit: RouterRateLimitConfig::Custom {
                    limits: create_test_limits(1, 1000), /* 1 request per
                                                         second - strict */
                },
                load_balance:
                    ai_gateway::config::balance::BalanceConfig::openai_chat(),
                ..Default::default()
            },
        ),
        (
            lenient_router_id.clone(),
            RouterConfig {
                rate_limit: RouterRateLimitConfig::Custom {
                    limits: create_test_limits(5, 1000), /* 5 requests per
                                                         second - lenient */
                },
                load_balance:
                    ai_gateway::config::balance::BalanceConfig::openai_chat(),
                ..Default::default()
            },
        ),
        (
            RouterId::Default,
            RouterConfig {
                rate_limit: RouterRateLimitConfig::None, // No rate limiting
                load_balance:
                    ai_gateway::config::balance::BalanceConfig::openai_chat(),
                ..Default::default()
            },
        ),
    ]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 5.into()),
            ("success:minio:upload_request", 5.into()),
            ("success:jawn:log_request", 5.into()),
            ("success:jawn:sign_s3_url", 5.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    // Test strict router (1 req/sec limit)
    // First request should succeed
    let status = make_chat_request_to_router(
        &mut harness,
        auth_header,
        &strict_router_id,
    )
    .await;
    assert_eq!(
        status,
        StatusCode::OK,
        "Strict router: Request 1 should succeed"
    );

    // Second request to strict router should be rate limited
    let status = make_chat_request_to_router(
        &mut harness,
        auth_header,
        &strict_router_id,
    )
    .await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "Strict router: Request 2 should be rate limited"
    );

    // Meanwhile, lenient router should still allow requests (independent
    // rate limiting) Make 1 request to lenient router - should succeed
    let status = make_chat_request_to_router(
        &mut harness,
        auth_header,
        &lenient_router_id,
    )
    .await;
    assert_eq!(
        status,
        StatusCode::OK,
        "Lenient router: Request should succeed (independent from strict \
         router)"
    );

    // Default router (no rate limiting) should also work independently
    for i in 1..=3 {
        let response = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "Default router: Request {i} should succeed (no rate limiting)"
        );
        let _body = response.into_body().collect().await.unwrap();
    }
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
}

async fn make_chat_request_to_router(
    harness: &mut Harness,
    auth_header: &str,
    router_id: &RouterId,
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
    let uri = match router_id {
        RouterId::Named(name) => format!(
            "http://router.helicone.com/router/{name}/v1/chat/completions"
        ),
        RouterId::Default => {
            "http://router.helicone.com/router/default/v1/chat/completions"
                .to_string()
        }
    };

    let request = Request::builder()
        .method(Method::POST)
        .header("authorization", auth_header)
        .uri(uri)
        .body(request_body)
        .unwrap();

    let response = harness.call(request).await.unwrap();
    let status = response.status();

    // Collect the body and sleep to ensure async logging completes
    let _response_body = response.into_body().collect().await.unwrap();
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    status
}

// Test 7: Multi-router scenario with different rate limit configs
// e.g:
// - If I request router a and then exceed the rate limit for router a, I should
//   be rate limited.
// - If I then request router b, the rate limiting *key* is shared, but since
//   router b has a higher rate limit config, I should be able to make requests
//   until I hit the capacity for router b's configuration.
//   - The router rate limiting layers use different in memory stores
// - If I then make requests to router c, since it has no rate limit configured,
//   I should be able to make requests.
#[tokio::test]
#[serial_test::serial]
async fn test_multi_router_different_rate_limits_in_memory() {
    let mut config = Config::test_default();
    config.helicone.enable_auth = true;
    config.global.rate_limit = Some(GlobalRateLimitConfig {
        store: RateLimitStore::InMemory,
        limits: None,
        cleanup_interval: Duration::from_secs(60),
    });
    let router_a_id = RouterId::Named(CompactString::from("router-a"));
    let router_b_id = RouterId::Named(CompactString::from("router-b"));
    let router_c_id = RouterId::Default;

    // Create multiple routers with different rate limit configurations
    config.routers = RouterConfigs::new(HashMap::from([
        (
            router_a_id.clone(),
            RouterConfig {
                rate_limit: RouterRateLimitConfig::Custom {
                    limits: create_test_limits(1, 1000),
                },
                load_balance:
                    ai_gateway::config::balance::BalanceConfig::openai_chat(),
                ..Default::default()
            },
        ),
        (
            router_b_id.clone(),
            RouterConfig {
                rate_limit: RouterRateLimitConfig::Custom {
                    limits: create_test_limits(3, 1000),
                },
                load_balance:
                    ai_gateway::config::balance::BalanceConfig::openai_chat(),
                ..Default::default()
            },
        ),
        (
            router_c_id.clone(),
            RouterConfig {
                rate_limit: RouterRateLimitConfig::None,
                load_balance:
                    ai_gateway::config::balance::BalanceConfig::openai_chat(),
                ..Default::default()
            },
        ),
    ]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 7.into()),
            ("success:minio:upload_request", 7.into()),
            ("success:jawn:log_request", 7.into()),
            ("success:jawn:sign_s3_url", 7.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .with_mock_auth()
        .build()
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    // Test Router A (1 request per second limit)
    // First request should succeed
    let response =
        make_chat_request_for_router(&mut harness, auth_header, &router_a_id)
            .await;
    assert_eq!(
        response.status(),
        StatusCode::OK,
        "Router A: Request 1 should succeed"
    );
    let _body = response.into_body().collect().await.unwrap();

    // Second request to Router A should be rate limited (exceeds 1 req/sec)
    let response =
        make_chat_request_for_router(&mut harness, auth_header, &router_a_id)
            .await;
    assert_eq!(
        response.status(),
        StatusCode::TOO_MANY_REQUESTS,
        "Router A: Request 2 should be rate limited"
    );
    let _body = response.into_body().collect().await.unwrap();

    // Test Router B (opts into global 3 requests per second)
    // While the rate limit key is the same, the two routers use different in
    // memory stores, and so Router B should allow 3 requests
    for i in 1..=3 {
        let response = make_chat_request_for_router(
            &mut harness,
            auth_header,
            &router_b_id,
        )
        .await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "Router B: Request {i} should succeed"
        );
        let _body = response.into_body().collect().await.unwrap();
    }
    let response =
        make_chat_request_for_router(&mut harness, auth_header, &router_b_id)
            .await;
    assert_eq!(
        response.status(),
        StatusCode::TOO_MANY_REQUESTS,
        "Router B: Request 4 should be rate limited"
    );
    let _body = response.into_body().collect().await.unwrap();

    // Test Router C (no rate limiting)
    // Should succeed regardless of previous requests
    for i in 1..=3 {
        let response = make_chat_request_for_router(
            &mut harness,
            auth_header,
            &router_c_id,
        )
        .await;
        assert_eq!(
            response.status(),
            StatusCode::OK,
            "Router C: Request {i} should succeed (no rate limiting)"
        );
        let _body = response.into_body().collect().await.unwrap();
    }
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
}
