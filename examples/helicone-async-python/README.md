# Helicone Async Python Example

This example demonstrates how to use the Helicone async Python SDK to log OpenAI API calls.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) package manager installed
- Helicone API key (get one at [helicone.ai](https://helicone.ai))
- OpenAI API key

## Getting Started

1. **Clone and navigate to the example directory:**
   ```bash
   cd examples/helicone-async-python/
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your actual API keys
   # HELICONE_API_KEY=your_actual_helicone_api_key
   # OPENAI_API_KEY=your_actual_openai_api_key
   ```

3. **Install dependencies with uv:**
   ```bash
   uv sync
   ```

4. **Run the example:**
   ```bash
   uv run python example.py
   ```