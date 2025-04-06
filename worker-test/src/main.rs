pub async fn test() {
    // 1. create mock request router
    let openai_request_body = serde_json::json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant that can answer
    questions and help with tasks."         },
            {
                "role": "user",
                "content": "hello world"
            }
        ],
        "max_tokens": 400
    });

    let openai_request: openai_types::chat::ChatCompletionRequest =
        serde_json::from_value(openai_request_body).unwrap();

    let bytes = serde_json::to_vec(&openai_request).unwrap();

    // 5. Print response as JSON
    let response = reqwest::Client::new()
        .post("http://localhost:8080/router/1234")
        .header("Content-Type", "application/json")
        .body(bytes)
        .send()
        .await
        .unwrap();
    let response_bytes =
        response.json::<serde_json::Value>().await.unwrap();
    println!("Anthropic response: {}", response_bytes);
}

#[tokio::main]
async fn main() {
    println!("Starting test...");
    test().await;
    println!("Test completed successfully!");
}
