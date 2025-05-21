# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Key Commands

### Development

```bash
# Build the project
cargo build

# Run the proxy server
cargo run

# Test HTTP request to your running proxy
cargo run -p test

# Run all tests with all features
cargo test --tests --all-features

# Run a specific test with all features (example)
cargo test single_provider --test single_provider --all-features

# Lint the code
cargo clippy
```

## Architecture Overview

This is an LLM proxy/router service that forwards API requests to providers like OpenAI and Anthropic. It handles load balancing, rate limiting, and request transformation between API formats.

### Core Components

1. **App Structure**:
   - `app.rs` - Core application with middleware stack setup
   - `main.rs` - Entry point that initializes telemetry, config, and runs the app

2. **Request Flow**:
   - **Middleware Stack**:
     - Global middleware (CatchPanic, HandleError, Auth, etc.)
     - Router-specific middleware (rate limits, request context, etc.)
     - Provider-specific middleware (mappers, balancers)
     - Dispatcher (final handler that makes the actual API request)

3. **Endpoints**:
   - `endpoints/openai` - Handlers for OpenAI API routes
   - `endpoints/anthropic` - Handlers for Anthropic API routes
   - `endpoints/mappings.rs` - Transforms requests between provider formats

4. **Providers and Balancing**:
   - `balancer/provider.rs` - Load balancing between different API providers
   - `discover` - Provider discovery and monitoring
   - Weighted balancing for distributing traffic across providers

5. **Configuration**:
   - Config is loaded from file and/or environment variables
   - Database, MinIO, server, provider, router config sections
   - Supports different deployment targets (Cloud, Sidecar, SelfHosted)

6. **Telemetry**:
   - Tracing with OpenTelemetry support
   - Metrics collection
   - Logging and error handling

7. **Error Handling**:
   - Rich error types for different categories (API, Auth, Init, etc.)
   - Middleware for panic catching and error response formatting

## Schema Filter

This crate provides filtering and validation of API requests according to OpenAPI specs, ensuring requests conform to provider requirements.

## Weighted Balance

Handles load balancing between multiple providers with different weights for traffic distribution.

## Infrastructure

The infrastructure directory contains configurations for:
- Docker Compose setup
- Grafana/Prometheus monitoring
- OpenTelemetry collector
- Self-signed certificates

## TypeScript & Node.js Integration

- The test directory contains Node.js tests for integration testing
- These interact with the proxy server to verify functionality