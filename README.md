
run server with: `ANTHROPIC_API_KEY="..." cargo run -p llm-proxy`
run test with: `cargo run -p worker-test`

this will proxy an OpenAI request to Anthropic. Change the commented out code in request_context.rs to 
proxy OpenAI request -> OpenAI.