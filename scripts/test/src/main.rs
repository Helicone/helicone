use futures::StreamExt;

pub async fn test() {
    dotenvy::dotenv().ok();
    let is_stream = false;
    let openai_request_body = serde_json::json!({
        "model": "openai/gpt-4o-mini",
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

    let helicone_api_key = std::env::var("HELICONE_API_KEY").unwrap();

    let response = reqwest::Client::new()
        .post("http://localhost:5678/router/v1/chat/completions")
        .header("Content-Type", "application/json")
        .header("authorization", helicone_api_key)
        .body(bytes)
        .send()
        .await
        .unwrap();
    println!("Status: {}", response.status());
    let trace_id = response
        .headers()
        .get("x-request-id")
        .unwrap()
        .to_str()
        .unwrap();
    println!("Trace ID: {}", trace_id);
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
