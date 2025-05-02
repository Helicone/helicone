# Helicone Router

## Local Development Setup Instructions

- Install Rust: https://www.rust-lang.org/tools/install
- Install direnv: https://direnv.net
- TODO: which various homebrew packages are needed? tls, protoc, etc
- Create a Helicone API key for the `test@helicone.ai` user 
  in the `Organization for Test`.
- `cp .envrc.template .envrc` and fill out the `PROXY__HELICONE__API_KEY`,
  `HELICONE_API_KEY`, `OPENAI_API_KEY`, and `ANTHROPIC_API_KEY` environment
  variables, and any others where your local environment does not match the
  default Helicone configuration.
- Start the router: `cargo run`
- Run an HTTP request against the router: `cargo run -p test`, this is the
  package in `test/src/main.rs` and will eventually be removed or upgraded
  to a CLI.
- Run unit + integration tests: `cargo t --test --all-features`. Requires
  a postgres database to be running for integration tests.