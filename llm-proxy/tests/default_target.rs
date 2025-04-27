use http::{Method, Request, StatusCode};
use llm_proxy::{
    config::Config,
    tests::{TestDefault, harness::Harness},
};
use serde_json::json;
use tower::Service;

/// Sending a request to https://oai.helicone.com/router/chat/<slug> should
/// result in the proxied request targeting https://api.openai.com/v1/chat/completions
#[tokio::test]
async fn default_target() {
    let config = Config::test_default();
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
        .uri("http://router.helicone.com/router/v1/chat/completions")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);

    // assert that the request was proxied to the mock server correctly
    let received_requests = harness
        .mock
        .received_requests_for("POST", "/v1/chat/completions")
        .await
        .expect("no requests received");
    assert_eq!(received_requests.len(), 1);
}
