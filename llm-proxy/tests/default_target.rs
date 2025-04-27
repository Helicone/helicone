use http::{Method, Request, StatusCode};
use llm_proxy::{config::Config, tests::harness::Harness};
use serde_json::json;
use tower::Service;
use url::Url;

/// Sending a request to https://oai.helicone.com/router/chat/<slug> should
/// result in the proxied request targeting https://api.openai.com/v1/chat/completions
#[tokio::test]
async fn default_target() {
    let config = Config::test_config();
    // let _logger_provider: opentelemetry_sdk::logs::LoggerProvider =
    // telemetry::init_telemetry(&config.telemetry).unwrap();
    let mut harness = Harness::new(config).await;
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
        .uri("http://router.helicone.com/router")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // assert that the request was proxied to the mock server
    let expected_url =
        Url::parse("https://api.openai.com/v1/chat/completions").unwrap();
    let received_requests = harness
        .mock
        .received_requests_for("POST", expected_url)
        .await
        .expect("no requests received");
    assert_eq!(received_requests.len(), 1);
}
