FROM lukemathwalker/cargo-chef:0.1.71-rust-1.87-bookworm AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --bin llm-proxy --recipe-path recipe.json

FROM chef AS builder 
# Install OpenSSL development libraries and pkg-config for Debian
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json
# Build application
COPY . .
RUN cargo build --release -p llm-proxy

# We do not need the Rust toolchain to run the binary!
FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/llm-proxy /usr/local/bin
CMD ["/usr/local/bin/llm-proxy"]