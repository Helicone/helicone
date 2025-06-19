1. Create Helicone account
2. Create Helicone API Key in Helicone UI
3. Copy template env file `cp .env.template .env`
4. Set the following env vars in `.env` file:
   - `PROXY__HELICONE__API_KEY`
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
5. Run the router locally with `cargo`:
   `cargo run -- -c llm-proxy/config/sidecar.yaml`
6. Run a test request:
   `cargo run -p test`
7. You should see a log in your Helicone account
   requests dashboard!