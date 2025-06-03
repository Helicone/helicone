# Helicone Router

## Local Development Setup Instructions

- Install Rust: https://www.rust-lang.org/tools/install
- Install Rust analyzer for your IDE.
- Setup the `--all-features` flag for your IDE. E.g. for VSCode,
  go to user preferences (`cmd+shift+p`), and add the line:
  `"rust-analyzer.cargo.features": "all"` to your preferences JSON.
- Create a Helicone API key for your Helicone user.
- `cp .env.template .env` and fill out the `PROXY__HELICONE__API_KEY`,
  `HELICONE_API_KEY`, `OPENAI_API_KEY`, and `ANTHROPIC_API_KEY` environment
  variables, and any others where your local environment does not match the
  default Helicone configuration.
- Start the docker compose stack: `cd infrastructure && docker compose up -d`
- Start the router (from the root of the repo):
  - with default configs: `cargo run`
  - with a dev config file: `cargo rl`
- Run an HTTP request against the router: `cargo run -p test`, this is the
  package in `scripts/test/src/main.rs` and will eventually be removed or upgraded
  to a CLI.
- Run unit + integration tests: `cargo int-test`

- TODO: which various homebrew packages are needed? tls, protoc, etc

# DEMO
- setup env vars
- run jawn+web
- run router locally with openai/anthropic: `cargo run -- -c ./llm-proxy/config/demo.yaml`
- send single request, see it logged in helicone dashboard: `cargo run -p test`
- change the load balancing strategy: uncomment file, `cargo run -- -c ...` again
- send some more requests, see it logged in helicone dashboard: `cargo run -p test`
- talk about future load balancing strategies
- load test example:
  - in one terminal: `cargo rlt`
  - in another: `cargo run -p mock-server`
  - in another: `cargo run -p test -- --run-forever`
- show grafana dashboard