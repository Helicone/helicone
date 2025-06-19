use std::collections::HashMap;

use ai_gateway::{
    config::Config,
    tests::{TestDefault, harness::Harness, mock::MockArgs},
};
use http::{Method, Request, StatusCode};
use serde_json::json;
use tower::Service;

/// Helper function to make a POST request to the specified URL
async fn make_request(
    url: &str,
    cache_control: Option<(&str, &str)>,
) -> Request<axum_core::body::Body> {
    let request_body = serde_json::to_vec(&json!({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Hello, world!"
            }
        ]
    }))
    .unwrap();

    let mut builder = Request::builder()
        .method(Method::POST)
        .uri(url)
        .header("content-type", "application/json");

    if let Some((name, value)) = cache_control {
        builder = builder.header(name, value);
    }

    builder
        .body(axum_core::body::Body::from(request_body))
        .unwrap()
}

/// Test that requests are cached when enabled globally via config.
/// This should check that requests on any of the three possible URLs
/// (`/ai/v1/chat/completions`, `/openai/v1/chat/completions`,
/// `/router/default/v1/chat/completions`) are cached. Start with the default
/// router and then expand the test cases.
///
/// In order to assert that the request is cached, we need to make sure that
/// the request is made twice. The first request will be a cache miss accoridng
/// to the `helicone-cache` response header and the second request should be a
/// hit according to the `helicone-cache` response header.
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn cache_enabled_globally() {
    let mut config = Config::test_default();
    config.helicone.enable_auth = false;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion_cacheable", 3.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    // First request - should be a cache miss
    let request = make_request(
        "http://router.helicone.com/router/default/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get("helicone-cache").unwrap(),
        "miss",
        "First request should be a cache miss"
    );

    // Second request - should be a cache hit
    let request = make_request(
        "http://router.helicone.com/router/default/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get("helicone-cache").unwrap(),
        "hit",
        "Second request should be a cache hit"
    );

    // Test passthrough endpoints
    // Test /openai/v1/chat/completions - first request should be a cache miss
    // since we have a different path (includes the prefix of the provider)
    let request = make_request(
        "http://router.helicone.com/openai/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get("helicone-cache").unwrap(),
        "miss",
        "First request to /openai endpoint should be a cache miss"
    );

    let request = make_request(
        "http://router.helicone.com/openai/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get("helicone-cache").unwrap(),
        "hit",
        "Second request to /openai endpoint should be a cache hit"
    );

    // test unified api
    // Test /ai/v1/chat/completions
    let request = make_request(
        "http://router.helicone.com/ai/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get("helicone-cache").unwrap(),
        "miss",
        "First request to /ai endpoint should be a cache miss"
    );

    let request = make_request(
        "http://router.helicone.com/ai/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get("helicone-cache").unwrap(),
        "hit",
        "Second request to /ai endpoint should be a cache hit"
    );
}

/// Test that requests are not cached when disabled globally via config.
/// This should check that requests on any of the three possible URLs
/// (`/ai/v1/chat/completions`, `/openai/v1/chat/completions`,
/// `/router/default/v1/chat/completions`) are NOT cached. Start with the
/// default router and then expand the test cases.
///
/// In order to assert that the request is not cached, we need to
/// sure the `helicone-cache` response header is never present
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn cache_disabled_globally() {
    let mut config = Config::test_default();
    config.helicone.enable_auth = false;
    // Ensure cache is NOT set globally (None by default)
    config.global.cache = None;

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion", 6.into()), // Multiple requests, all should hit the backend
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    // Test multiple requests to ensure cache header is never present

    // Test default router endpoint
    // First request - should not have cache header
    let request = make_request(
        "http://router.helicone.com/router/default/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should not be present when cache is disabled"
    );

    // Second request - should still not have cache header
    let request = make_request(
        "http://router.helicone.com/router/default/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should not be present on second request when cache is \
         disabled"
    );

    // Test passthrough endpoints
    // Test /openai/v1/chat/completions
    let request = make_request(
        "http://router.helicone.com/openai/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should not be present on /openai endpoint when cache is \
         disabled"
    );

    let request = make_request(
        "http://router.helicone.com/openai/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should still not be present on second request to \
         /openai endpoint"
    );

    // Test unified api
    // Test /ai/v1/chat/completions
    let request = make_request(
        "http://router.helicone.com/ai/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should not be present on /ai endpoint when cache is \
         disabled"
    );

    let request = make_request(
        "http://router.helicone.com/ai/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should still not be present on second request to /ai \
         endpoint"
    );
}

/// Test that requests are cached when enabled per router via config.
/// This should check that requests on any of the three possible URLs
/// (`/ai/v1/chat/completions`, `/openai/v1/chat/completions`,
/// `/router/default/v1/chat/completions`) are cached. Start with the default
/// router and then expand the test cases.
///
/// In order to assert that the request is cached, we need to
/// sure the `helicone-cache` response header is present when expected.
///
/// Also, we need to make sure that if a request is cached for one router,
/// it is not cached for another router, i.e. that they are independent and
/// isolated caches.
#[tokio::test]
#[serial_test::serial(default_mock)]
async fn cache_enabled_per_router() {
    use ai_gateway::{
        config::{
            cache::{CacheConfig, CacheStore},
            router::{RouterConfig, RouterConfigs},
        },
        types::router::RouterId,
    };
    use compact_str::CompactString;

    let mut config = Config::test_default();
    // Disable auth for this test since we're testing basic passthrough
    // functionality
    config.helicone.enable_auth = false;
    config.global.cache = None;

    // Create multiple routers with different cache configurations
    let router_with_cache_id = RouterId::Named(CompactString::from("cached"));
    let router_without_cache_id =
        RouterId::Named(CompactString::from("uncached"));

    config.routers = RouterConfigs::new(HashMap::from([
        (
            router_with_cache_id.clone(),
            RouterConfig {
                cache: Some(CacheConfig {
                    store: CacheStore::InMemory {
                        max_size: 1024 * 1024,
                    },
                    directive: None,
                    buckets: 1,
                    seed: Some("router-cached-seed".to_string()),
                }),
                load_balance:
                    ai_gateway::config::balance::BalanceConfig::openai_chat(),
                ..Default::default()
            },
        ),
        (
            router_without_cache_id.clone(),
            RouterConfig {
                cache: None, // No cache for this router
                load_balance:
                    ai_gateway::config::balance::BalanceConfig::openai_chat(),
                ..Default::default()
            },
        ),
        (
            RouterId::Default,
            RouterConfig {
                cache: None, // Default router also has no cache
                load_balance:
                    ai_gateway::config::balance::BalanceConfig::openai_chat(),
                ..Default::default()
            },
        ),
    ]));

    let mock_args = MockArgs::builder()
        .stubs(HashMap::from([
            ("success:openai:chat_completion_cacheable", 5.into()),
            ("success:minio:upload_request", 0.into()),
            ("success:jawn:log_request", 0.into()),
        ]))
        .build();

    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;

    // Test 1: Router with cache enabled
    // First request - should be a cache miss
    let request = make_request(
        "http://router.helicone.com/router/cached/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get("helicone-cache").unwrap(),
        "miss",
        "First request should be a cache miss"
    );

    // Second request to same router - should be a cache hit
    let request = make_request(
        "http://router.helicone.com/router/cached/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get("helicone-cache").unwrap(),
        "hit",
        "Second request should be a cache hit"
    );

    // Test 2: Router without cache
    // Both requests should not have cache headers
    let request = make_request(
        "http://router.helicone.com/router/uncached/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should not be present when cache is disabled"
    );

    // Second request to uncached router
    let request = make_request(
        "http://router.helicone.com/router/uncached/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should not be present on second request when cache is \
         disabled"
    );

    // Test 3: Default router (no cache)
    let request = make_request(
        "http://router.helicone.com/router/default/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should not be present on default router when cache is \
         not configured"
    );

    let request = make_request(
        "http://router.helicone.com/router/default/v1/chat/completions",
        Some(("cache-control", "max-age=3600")),
    )
    .await;
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response.headers().get("helicone-cache").is_none(),
        "Cache header should still not be present on second request to \
         default router"
    );
}
