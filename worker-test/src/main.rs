use bytes::Bytes;
use http_body_util::BodyExt;

pub async fn test() {
    // // 1. create mock request router
    // let openai_request_body = serde_json::json!({
    //     "model": "gpt-4o-mini",
    //     "messages": [
    //         {
    //             "role": "system",
    //             "content": "You are a helpful assistant that can answer questions and help with tasks."
    //         },
    //         {
    //             "role": "user",
    //             "content": "hello world"
    //         }
    //     ],
    //     "max_tokens": 400
    // });

    // let openai_request: openai_types::chat::ChatCompletionRequest =
    //     serde_json::from_value(openai_request_body).unwrap();

    // let bytes = serde_json::to_vec(&openai_request).unwrap();
    // let body = http_body_util::Full::new(Bytes::from(bytes));
    // let http_request: http::Request<http_body_util::Full<Bytes>> =
    //     http::Request::builder()
    //         .method("POST")
    //         .uri("https://foo.com/router/1234")
    //         .header("Content-Type", "application/json")
    //         .body(body)
    //         .unwrap();

    // let config = llm_proxy::types::config::Config::default();

    // // 5. Print response as JSON
    // let response = llm_proxy::router::route(http_request, config)
    //     .await
    //     .unwrap();
    // let response_bytes =
    //     response.body().clone().collect().await.unwrap().to_bytes();
    // let response_json =
    //     serde_json::from_slice::<serde_json::Value>(&response_bytes).unwrap();
    // println!("Anthropic response: {}", response_json);
}

#[tokio::main]
async fn main() {
    println!("Starting test...");
    test().await;
    println!("Test completed successfully!");
}
