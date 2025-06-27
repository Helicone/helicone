# 🎮 Demo Guide

Here are instructions for running a demo of Helicone AI Gateway locally.

## Basic Setup
1. Set up environment variables as described in the [Development Setup](DEVELOPMENT.md) section
2. Run the router locally with OpenAI/Anthropic:
   ```bash
   cargo run -- -c ./llm-proxy/config/demo.yaml
   ```
3. Send a test request:
   ```bash
   cargo run -p test
   ```
   You should see the request logged in your Helicone dashboard

On macOS with Homebrew:
```bash
brew install openssl protobuf pkg-config
```

### Load Testing
1. Start the load test server:
   ```bash
   cargo rlt
   ```
2. In another terminal, start the mock server:
   ```bash
   cargo run -p mock-server
   ```
3. In a third terminal, run continuous test requests:
   ```bash
   cargo run -p test -- --run-forever
   ```
4. Monitor the results in your Grafana dashboard

---
