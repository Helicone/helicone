## Contributing

Hi there!

We're thrilled that you'd like to contribute to Helicone Helix.

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Issues and PRs

If you have suggestions for how this project could be improved, or want to report a bug, open an issue! We'd love all and any contributions. If you have questions, too, we'd love to hear them.

We'd also love PRs. If you're thinking of a large PR, we advise opening up an issue first to talk about it, though! Look at the links below if you're not sure how to open a PR.

## Submitting a pull request

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Helicone API key](https://docs.helicone.ai/api-keys)
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Setup

1. [Fork](https://github.com/Helicone/helicone-router/fork) and clone the repository.
2. Add environment variables to `.env`
```
cp .env.template .env
```
1. Start docker compose
```bash
cd infrastructure && docker compose up -d && cd ..
```
1. Start the router from root
```bash
cargo run

# Or with a dev config file:
cargo rl
```
5. Run tests
```bash
# Run an HTTP request against the router. This uses the package in scripts/test/src/main.rs
cargo run -p test

# Standard unit tests
cargo test

# Integration tests
cargo int-test
```
6. Build
```bash
# Debug build
cargo build

# Optimized release build
cargo build --release

# (optional) File watching for development
cargo install cargo-watch
cargo watch -x run
```
7. Create a new branch: `git checkout -b my-branch-name`.
8. Make your change, add tests, and make sure the tests still pass.
9. Commit your change using [the conventional commit format](https://www.conventionalcommits.org/en/v1.0.0/)
10. Push to your fork and [submit a pull request](https://github.com/Helicone/helicone-router/compare).
9. Push to your fork and [submit a pull request](https://github.com/Helicone/helicone-router/compare).
10. Pat your self on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:
- Write and update tests.
- Keep your changes as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
- Write a good commit message, including why the change is needed, changes made, any relevant links, and screenshots or gifs where appropriate.

Work in Progress pull requests are also welcome to get feedback early on, or if there is something blocked you.
