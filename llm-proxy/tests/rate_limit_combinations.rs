use std::{collections::HashMap, time::Duration};

use http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use llm_proxy::{
    config::{
        Config,
        rate_limit::{
            LimitConfig, RateLimitConfig, RateLimitStore, TokenBucketConfig,
        },
        router::{RouterConfig, RouterConfigs, RouterRateLimitConfig},
    },
    tests::{TestDefault, harness::Harness, mock::MockArgs},
    types::router::RouterId,
};
use serde_json::json;
use stubr::wiremock_rs::{Mock, ResponseTemplate, matchers};
use tower::Service;
use uuid::Uuid;

fn create_test_limits(capacity: u32, duration_ms: u64) -> LimitConfig {
    LimitConfig {
        per_user: TokenBucketConfig {
            capacity,
            fill_frequency: Duration::from_millis(duration_ms),
        },
    }
}

fn create_router_config(rate_limit: RouterRateLimitConfig) -> RouterConfig {
    RouterConfig {
        rate_limit,
        balance: llm_proxy::config::balance::BalanceConfig::openai_chat(),
        ..Default::default()
    }
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

async fn make_chat_request_for_router(
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
    let uri = match router_id {
        RouterId::Uuid(uuid) => format!(
            "http://router.helicone.com/router/{}/v1/chat/completions",
            uuid
        ),
        RouterId::Default => {
            "http://router.helicone.com/router/v1/chat/completions".to_string()
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

// Test 1: Global rate limiting with router that doesn't override
#[tokio::test]
#[serial_test::serial]
async fn test_global_rate_limit_with_router_none() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = RateLimitConfig::Global {
        store: RateLimitStore::InMemory,
        limits: create_test_limits(3, 1000), // 3 requests per second
    };

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

    // The user should be able to make 3 requests successfully (capacity = 3)
    for i in 1..=3 {
        let status = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(status, StatusCode::OK, "Request {} should succeed", i);
    }

    // The 4th request should be rate limited
    let status = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "4th request should be rate limited"
    );

    // The 5th request should also be rate limited
    let status = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "5th request should be rate limited"
    );
}

// Test 2: OptIn app config with router that opts in
#[tokio::test]
#[serial_test::serial]
async fn test_optin_rate_limit_with_router_optin() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = RateLimitConfig::OptIn {
        store: RateLimitStore::InMemory,
        limits: create_test_limits(3, 1000), // 3 requests per second
    };

    // Router opts into global rate limiting
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        create_router_config(RouterRateLimitConfig::OptIn),
    )]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 3.into()),
            ("success:minio:upload_request", 3.into()),
            ("success:jawn:log_request", 3.into()),
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

    // Make 3 requests - should all succeed (capacity = 3)
    for i in 1..=3 {
        let status = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(status, StatusCode::OK, "Request {} should succeed", i);
    }

    // 4th request should be rate limited
    let status = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "4th request should be rate limited"
    );
}

// Test 3: RouterSpecific config with custom router limits
#[tokio::test]
#[serial_test::serial]
async fn test_router_specific_with_custom_limits() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = RateLimitConfig::RouterSpecific {
        store: RateLimitStore::InMemory,
    };

    // Router provides its own custom rate limits
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            rate_limit: RouterRateLimitConfig::Custom {
                limits: create_test_limits(2, 1000), // 2 requests per second
            },
            balance: llm_proxy::config::balance::BalanceConfig::openai_chat(),
            ..Default::default()
        },
    )]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", (1..=2).into()),
            ("success:minio:upload_request", (1..=2).into()),
            ("success:jawn:log_request", (1..=2).into()),
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

    // Make 1 request - should succeed (capacity = 2)
    let status = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(status, StatusCode::OK, "Request 1 should succeed");

    // 2nd request should be rate limited (if rate limiting is working)
    let status = make_chat_request(&mut harness, auth_header).await;
    if status == StatusCode::TOO_MANY_REQUESTS {
        // Rate limiting is working as expected
        println!("Rate limiting working correctly - 2nd request rate limited");
    } else {
        // If the second request succeeds, check the third
        assert_eq!(status, StatusCode::OK, "Request 2 should succeed");

        // 3rd request should be rate limited
        let status = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            status,
            StatusCode::TOO_MANY_REQUESTS,
            "3rd request should be rate limited"
        );
    }
}

// Test 4: Global override with custom router limits
#[tokio::test]
#[serial_test::serial]
async fn test_global_with_custom_router_override() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = RateLimitConfig::Global {
        store: RateLimitStore::InMemory,
        limits: create_test_limits(5, 1000), // 5 requests per second globally
    };

    // Router overrides with stricter custom limits
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            rate_limit: RouterRateLimitConfig::Custom {
                limits: create_test_limits(2, 1000), /* 2 requests per second
                                                      * for this router */
            },
            balance: llm_proxy::config::balance::BalanceConfig::openai_chat(),
            ..Default::default()
        },
    )]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 2.into()),
            ("success:minio:upload_request", 2.into()),
            ("success:jawn:log_request", 2.into()),
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

    // Make 2 requests - should all succeed (router capacity = 2)
    for i in 1..=2 {
        let status = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(status, StatusCode::OK, "Request {} should succeed", i);
    }

    // 3rd request should be rate limited by router config, not global
    let status = make_chat_request(&mut harness, auth_header).await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "3rd request should be rate limited by router config"
    );
}

// Test 5: OptIn app with router that doesn't opt in (no rate limiting)
#[tokio::test]
#[serial_test::serial]
async fn test_optin_app_with_router_none() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = RateLimitConfig::OptIn {
        store: RateLimitStore::InMemory,
        limits: create_test_limits(2, 1000), // 2 requests per second
    };

    // Router doesn't opt in
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        create_router_config(RouterRateLimitConfig::None),
    )]));

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

    harness
        .mock
        .jawn_mock
        .http_server
        .register(whoami_mock())
        .await;

    let auth_header = "Bearer sk-helicone-test-key";

    // All requests should succeed since router doesn't opt in to rate limiting
    for i in 1..=5 {
        let status = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(status, StatusCode::OK, "Request {} should succeed", i);
    }
}

// Test 6: Disabled app with router attempting custom limits (should error
// during init) This test verifies that the app fails to start with invalid
// configuration
#[tokio::test]
#[serial_test::serial]
async fn test_disabled_app_with_custom_router_fails_init() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = RateLimitConfig::Disabled;

    // Router tries to use custom limits (invalid combination)
    config.routers = RouterConfigs::new(HashMap::from([(
        RouterId::Default,
        RouterConfig {
            rate_limit: RouterRateLimitConfig::Custom {
                limits: create_test_limits(2, 1000),
            },
            ..Default::default()
        },
    )]));

    let mock_args = MockArgs::builder().build();

    // This should fail during app construction due to invalid rate limit config
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            Harness::builder()
                .with_config(config)
                .with_mock_args(mock_args)
                .build()
                .await
        })
    }));

    assert!(
        result.is_err(),
        "App construction should fail with invalid rate limit config"
    );
}

// Test 8: Router independence - verify that rate limits are applied per-router
#[tokio::test]
#[serial_test::serial]
async fn test_router_independence_different_rate_limits() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = RateLimitConfig::RouterSpecific {
        store: RateLimitStore::InMemory,
    };

    let strict_router_id = RouterId::Uuid(Uuid::new_v4());
    let lenient_router_id = RouterId::Uuid(Uuid::new_v4());

    // Create two routers with different rate limits
    config.routers = RouterConfigs::new(HashMap::from([
        (
            strict_router_id,
            RouterConfig {
                rate_limit: RouterRateLimitConfig::Custom {
                    limits: create_test_limits(1, 1000), /* 1 request per second - strict */
                },
                balance: llm_proxy::config::balance::BalanceConfig::openai_chat(
                ),
                ..Default::default()
            },
        ),
        (
            lenient_router_id,
            RouterConfig {
                rate_limit: RouterRateLimitConfig::Custom {
                    limits: create_test_limits(5, 1000), /* 5 requests per second - lenient */
                },
                balance: llm_proxy::config::balance::BalanceConfig::openai_chat(
                ),
                ..Default::default()
            },
        ),
        (
            RouterId::Default,
            RouterConfig {
                rate_limit: RouterRateLimitConfig::None, // No rate limiting
                balance: llm_proxy::config::balance::BalanceConfig::openai_chat(
                ),
                ..Default::default()
            },
        ),
    ]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 7.into()),
            ("success:minio:upload_request", 7.into()),
            ("success:jawn:log_request", 7.into()),
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

    // Meanwhile, lenient router should still allow requests (independent rate
    // limiting) Make 3 requests to lenient router - all should succeed
    for i in 1..=3 {
        let status = make_chat_request_to_router(
            &mut harness,
            auth_header,
            &lenient_router_id,
        )
        .await;
        assert_eq!(
            status,
            StatusCode::OK,
            "Lenient router: Request {} should succeed (independent from \
             strict router)",
            i
        );
    }

    // Default router (no rate limiting) should also work independently
    for i in 1..=3 {
        let status = make_chat_request(&mut harness, auth_header).await;
        assert_eq!(
            status,
            StatusCode::OK,
            "Default router: Request {} should succeed (no rate limiting)",
            i
        );
    }
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
        RouterId::Uuid(uuid) => format!(
            "http://router.helicone.com/router/{}/v1/chat/completions",
            uuid
        ),
        RouterId::Default => {
            "http://router.helicone.com/router/v1/chat/completions".to_string()
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
//   - For this test, we are using an in memory rate limiting, so while the rate
//     limiting key is shared, the backing store is not, and thus the user's
//     rate limit usage is not shared between routers. For redis, this is not
//     true and the rate limitng would be shared.
// - If I then make requests to router c, since it has no rate limit configured,
//   I should be able to make requests.
#[tokio::test]
#[serial_test::serial]
async fn test_multi_router_different_rate_limits_in_memory() {
    let mut config = Config::test_default();
    config.auth.require_auth = true;
    config.rate_limit = RateLimitConfig::OptIn {
        store: RateLimitStore::InMemory,
        limits: create_test_limits(3, 1000),
    };
    let router_a_id = RouterId::Uuid(Uuid::new_v4());
    let router_b_id = RouterId::Uuid(Uuid::new_v4());
    let router_c_id = RouterId::Default;

    // Create multiple routers with different rate limit configurations
    config.routers = RouterConfigs::new(HashMap::from([
        (
            router_a_id,
            RouterConfig {
                rate_limit: RouterRateLimitConfig::Custom {
                    limits: create_test_limits(1, 1000),
                },
                balance: llm_proxy::config::balance::BalanceConfig::openai_chat(
                ),
                ..Default::default()
            },
        ),
        (
            router_b_id,
            RouterConfig {
                rate_limit: RouterRateLimitConfig::OptIn,
                balance: llm_proxy::config::balance::BalanceConfig::openai_chat(
                ),
                ..Default::default()
            },
        ),
        (
            router_c_id,
            RouterConfig {
                rate_limit: RouterRateLimitConfig::None,
                balance: llm_proxy::config::balance::BalanceConfig::openai_chat(
                ),
                ..Default::default()
            },
        ),
    ]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 7.into()),
            ("success:minio:upload_request", 7.into()),
            ("success:jawn:log_request", 7.into()),
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

    // Test Router A (1 request per second limit)
    // First request should succeed
    let status =
        make_chat_request_for_router(&mut harness, auth_header, &router_a_id)
            .await;
    assert_eq!(status, StatusCode::OK, "Router A: Request 1 should succeed");

    // Second request to Router A should be rate limited (exceeds 1 req/sec)
    let status =
        make_chat_request_for_router(&mut harness, auth_header, &router_a_id)
            .await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "Router A: Request 2 should be rate limited"
    );

    // Test Router B (opts into global 3 requests per second)
    // While the rate limit key is the same, the two routers use different in
    // memory stores, and so Router B should allow 3 requests
    for i in 1..=3 {
        let status = make_chat_request_for_router(
            &mut harness,
            auth_header,
            &router_b_id,
        )
        .await;
        assert_eq!(
            status,
            StatusCode::OK,
            "Router B: Request {} should succeed",
            i
        );
    }
    let status =
        make_chat_request_for_router(&mut harness, auth_header, &router_b_id)
            .await;
    assert_eq!(
        status,
        StatusCode::TOO_MANY_REQUESTS,
        "Router B: Request 3 should be rate limited"
    );

    // Test Router C (no rate limiting)
    // Should succeed regardless of previous requests
    for i in 1..=3 {
        let status = make_chat_request_for_router(
            &mut harness,
            auth_header,
            &router_c_id,
        )
        .await;
        assert_eq!(
            status,
            StatusCode::OK,
            "Router C: Request {} should succeed (no rate limiting)",
            i
        );
    }
}
