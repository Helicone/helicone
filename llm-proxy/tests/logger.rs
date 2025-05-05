use std::collections::HashSet;

use http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use llm_proxy::{
    config::Config,
    tests::{TestDefault, harness::Harness, mock::MockArgs},
};
use serde_json::json;
use tower::Service;

#[tokio::test]
#[serial_test::serial]
async fn request_response_logger() {
    let config = Config::test_default();
    let mock_args = MockArgs::builder()
        .stubs_in_scope(HashSet::from([
            "success:openai:chat_completion".to_string(),
            "success:minio:upload_request".to_string(),
            "success:jawn:log_request".to_string(),
        ]))
        .build();
    let mut harness = Harness::builder()
        .with_config(config)
        .with_mock_args(mock_args)
        .build()
        .await;
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

    // sleep so that the background task for logging can complete
    // the proper way to write this test without a sleep is to
    // test it at the dispatcher level by returning a handle
    // to the async task and awaiting it in the test.
    //
    // but this is totes good for now
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;

    harness.mock.jawn_mock.verify().await;
    harness.mock.minio_mock.verify().await;
    harness.mock.openai_mock.verify().await;
}
