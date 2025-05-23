use futures::StreamExt;

pub async fn test() {
    let is_stream = false;
    let openai_request_body = serde_json::json!({
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant that can answer
    questions and help with tasks."
            },
            {
                "role": "user",
                "content": "hello world"
            }
        ],
        "max_tokens": 400,
        "stream": is_stream
    });

    let openai_request: async_openai::types::CreateChatCompletionRequest =
        serde_json::from_value(openai_request_body).unwrap();

    let bytes = serde_json::to_vec(&openai_request).unwrap();

    let response = reqwest::Client::new()
        .post("http://localhost:5678/router/v1/chat/completions")
        .header("Content-Type", "application/json")
        // TODO: When we implement team keys we can add them here
        // .header(
        //     "authorization",
        //     format!(
        //         "Bearer {}",
        //         std::env::var("ROUTER_TEAM_API_KEY") // RIGHT NOW TEAM LOGIC
        // IS NOT IMPLEMENTED             .unwrap_or_else(|_|
        // "mock-api-key".to_string())     ),
        // )
        .body(bytes)
        .send()
        .await
        .unwrap();
    println!("Status: {}", response.status());
    if is_stream {
        let mut body_stream = response.bytes_stream();
        while let Some(Ok(chunk)) = body_stream.next().await {
            let json =
                serde_json::from_slice::<serde_json::Value>(&chunk).unwrap();
            let pretty_json = serde_json::to_string_pretty(&json).unwrap();
            println!("Chunk: {}", pretty_json);
        }
    } else {
        let response_bytes =
            response.json::<serde_json::Value>().await.unwrap();
        println!("Response: {}", response_bytes);
    }
}

#[tokio::main]
async fn main() {
    println!("Starting test...");
    test().await;
    println!("Test completed successfully!");
}
