use std::time::Duration;

use clap::Parser;
use futures::StreamExt;
use rand::Rng;
use tokio::{
    signal,
    time::{Instant, sleep},
};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Run requests forever in a loop until Ctrl+C is pressed
    #[arg(long)]
    run_forever: bool,
}

pub async fn test(run_forever_mode: bool) {
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

    let helicone_api_key =
        std::env::var("HELICONE_CONTROL_PLANE_API_KEY").unwrap();

    let response = reqwest::Client::new()
        .post("http://localhost:8080/router/default/v1/chat/completions")
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
    if !run_forever_mode {
        if is_stream {
            let mut body_stream = response.bytes_stream();
            while let Some(Ok(chunk)) = body_stream.next().await {
                let json = serde_json::from_slice::<serde_json::Value>(&chunk)
                    .unwrap();
                let pretty_json = serde_json::to_string_pretty(&json).unwrap();
                println!("Chunk: {}", pretty_json);
            }
        } else {
            let response_bytes =
                response.json::<serde_json::Value>().await.unwrap();
            println!("Response: {}", response_bytes);
        }
    }
}

async fn run_forever_loop() {
    let mut rng = rand::thread_rng();
    let mut request_count = 0u64;
    let start_time = Instant::now();

    loop {
        tokio::select! {
            _ = signal::ctrl_c() => {
                let elapsed = start_time.elapsed();
                let rps = request_count as f64 / elapsed.as_secs_f64();
                println!("\nShutdown signal received!");
                println!("Total requests: {}", request_count);
                println!("Total time: {:.2}s", elapsed.as_secs_f64());
                println!("Average RPS: {:.2}", rps);
                break;
            }
            _ = async {
                test(true).await;
                request_count += 1;

                if request_count % 100 == 0 {
                    let elapsed = start_time.elapsed();
                    let current_rps = request_count as f64 / elapsed.as_secs_f64();
                    println!("Requests sent: {}, Current RPS: {:.2}", request_count, current_rps);
                }

                let delay_ms = rng.gen_range(0..=2);
                sleep(Duration::from_millis(delay_ms)).await;
            } => {}
        }
    }
}

#[tokio::main]
async fn main() {
    let args = Args::parse();
    dotenvy::dotenv().ok();

    if args.run_forever {
        println!("Starting load test - press Ctrl+C to stop...");
        run_forever_loop().await;
    } else {
        println!("Starting single test...");
        test(false).await;
        println!("Test completed successfully!");
    }
}
