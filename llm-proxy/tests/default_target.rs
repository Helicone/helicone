use llm_proxy::{config::Config, tests::harness::Harness};
use http::{Method, Request, StatusCode};
use serde_json::json;

/// Sending a request to https://oai.helicone.com/router/chat/<slug> should
/// result in the proxied request targeting https://api.openai.com/v1/chat/completions
#[tokio::test]
async fn default_target() {
    let config = Config::test_config();
    let mut harness = Harness::builder(config).build();
    let request_body = reqwest::Body::from(serde_json::to_vec(&json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Hello, world!"
            }
        ]
    })).unwrap());
    let request = Request::builder()
        .method(Method::POST)
        .uri("http://router.helicone.com/router/<slug>")
        .body(request_body)
        .unwrap();
    let response = harness.call(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}
