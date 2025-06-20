# Scripts Directory

This directory contains various testing and utility scripts for the Helicone Router project.

## Contents

### `trace-test-client/`

A manual testing tool for tracing and propagation functionality. This tool runs against a real environment and is used for manual testing of tracing features.

### `test/`

Integration tests and test utilities for the Helicone Router project. These tests are designed to run against a real or mocked environment.

## Usage

### Running trace-test-client

```bash
cd scripts/trace-test-client
cargo run

cd scripts/test
cargo run
```

### Running Unit Tests

```bash
cd ai-gateway
cargo test --features testing
```
