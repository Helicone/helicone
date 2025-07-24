# NVIDIA Dynamo Support for AI Gateway

This implementation adds support for NVIDIA Dynamo as a provider in the Helicone AI Gateway, following the established pattern for OpenAI-compatible providers.

## What is NVIDIA Dynamo?

NVIDIA Dynamo is an internal or localhost-hosted model service that provides access to NVIDIA's language models through an OpenAI-compatible API. This is commonly used in enterprise environments where models are hosted on internal infrastructure with hostnames like `internal.company.kube`.

## Implementation

This follows the pattern established in [PR #211 (Mistral support)](https://github.com/Helicone/ai-gateway/pull/211), which added ~90% YAML configuration and ~10 lines of code in the registry.

### Files Modified

1. **`ai-gateway/config/embedded/providers.yaml`** - Added NVIDIA Dynamo provider configuration
2. **`ai-gateway/config/embedded/model-mapping.yaml`** - Added model mappings for NVIDIA models  
3. **`ai-gateway/src/middleware/mapper/registry.rs`** - Added converter registration (16 lines)
4. **`ai-gateway/tests/`** - Added test cases (optional)

### Key Features

- **OpenAI-Compatible**: Uses the existing OpenAI-compatible converter
- **Internal Hostname Support**: Configurable base-url pointing to `internal.company.kube` or any localhost endpoint
- **Model Mapping**: Intelligent fallbacks between NVIDIA models and other providers
- **Load Balancing**: Can be mixed with other providers for redundancy
- **Caching & Rate Limiting**: Full feature support

## Configuration

### Basic Configuration

```yaml
routers:
  production:
    load-balance:
      chat:
        strategy: latency
        providers:
          - nvidia-dynamo
          - openai  # fallback

providers:
  nvidia-dynamo:
    base-url: "http://internal.company.kube"
```

### Environment Variables

No special API key is required for localhost/internal deployments. If authentication is needed, you can set:

```bash
NVIDIA_DYNAMO_API_KEY=your_key_here
```

### Available Models

- `nvidia/llama3-70b`
- `nvidia/llama3-8b` 
- `nvidia/mixtral-8x7b`
- `nvidia/mistral-7b`
- `nvidia/gemma-7b`
- `nvidia/codellama-34b`
- `nvidia/starcoder2-15b`
- `nvidia/nemotron-4-340b`
- `nvidia/llama3.1-8b`
- `nvidia/llama3.1-70b`
- `nvidia/llama3.1-405b`

## Usage Examples

### Direct API Calls

```bash
curl -X POST http://localhost:8080/ai/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nvidia-dynamo/nvidia/llama3.1-70b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### OpenAI SDK

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:8080/router/production",
    api_key="placeholder"  # Gateway handles real auth
)

response = client.chat.completions.create(
    model="nvidia-dynamo/nvidia/llama3.1-70b",
    messages=[{"role": "user", "content": "Hello from NVIDIA Dynamo!"}]
)
```

### Model Mapping

When load balancing routes to other providers, NVIDIA models automatically map to equivalent models:

- `nvidia/llama3.1-70b` → `gpt-4o`, `claude-3-5-sonnet`, `mistral-large`
- `nvidia/llama3-8b` → `gpt-4o-mini`, `claude-3-5-haiku`, `mistral-small`
- `nvidia/nemotron-4-340b` → `o3`, `claude-opus-4-0`, `mistral-saba`

## Architecture

```
User Request → AI Gateway → Load Balancer → NVIDIA Dynamo (internal.company.kube)
                                       ↘ Fallback to OpenAI/Anthropic
```

## Testing

Run the included tests:

```bash
# Test NVIDIA Dynamo provider directly
cargo test nvidia_dynamo

# Test unified API with NVIDIA Dynamo
cargo test nvidia_dynamo_unified_api
```

## Benefits

1. **Enterprise Integration**: Connect to internal NVIDIA model deployments
2. **Cost Optimization**: Use internal compute resources before falling back to cloud
3. **Latency Optimization**: Internal models typically have lower latency
4. **Compliance**: Keep sensitive data within enterprise boundaries
5. **Unified Interface**: Same OpenAI-compatible API for all providers

## Configuration Flexibility

The base-url can be customized for different deployment scenarios:

```yaml
nvidia-dynamo:
  base-url: "http://internal.company.kube"      # Internal DNS
  # base-url: "http://192.168.1.100:8080"       # Internal IP
  # base-url: "http://localhost:11434"          # Local development
  # base-url: "https://nvidia.company.com"      # HTTPS endpoint
```

This implementation provides a production-ready way to integrate NVIDIA Dynamo models into the AI Gateway ecosystem while maintaining all the advanced features like load balancing, caching, and observability.