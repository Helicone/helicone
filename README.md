
run server with: `ANTHROPIC_API_KEY="..." cargo run -p llm-proxy`
run test with: `cargo run -p worker-test`

this will proxy an OpenAI request to Anthropic. Change the commented out code in request_context.rs to 
proxy OpenAI request -> OpenAI.


## Notion notes


By default we should just proxy without checking any auth before proxying. 

# Vision

Router Features

- Cache
- A/B Load balancing
    - Prompt Versions
    - Models
- ^ Related - Fallbacks
    - should fallbacks be top-level or should there be a fallback config per each model/prompt version? (ie, so that if I target Anthropic but I start AB testing OpenAI, should I have the OpenAI routes fallback to an OpenAI model? ideally fallbacks don’t happen often so is it worth it to keep it simple, or is there value in more complex config?)
- What models you want to connect with
- RBAC
    - Rate limiter
- Retries

```rust
struct Router {
  cache: CacheControl,
  fallback: FallbackConfig,
  balance: LoadBalanceConfig,
  retries: RetryConfig,
  rate_limit: RateLimitConfig,
}

struct CacheControl {
	max_age: u64
	max_stale: u64
	buckets: u16
	seed: String
}

struct FallbackConfig {
  enabled: bool,
  order: Vec<ModelVersion>
}

struct LoadBalanceConfig(HashMap<Version, Weight>);

enum Version {
  Prompt(PromptVersion),
  Model(ModelVersion),
}

struct Weight(f64);

struct RetryConfig {
  enabled: bool,
  max_retries: u8,
}

// presumably, the below are not configured by the user
pub struct RateLimitConfig {
    pub unauthenticated: LimitConfig,
    pub authenticated: LimitConfig,
}

pub struct LimitConfig {
    // the interval after which one element of the quota is replenished.
    pub period: Duration,
    pub quota_size: u32,
}
```

Competitors:

- https://developers.cloudflare.com/ai-gateway/
- Portkey https://github.com/Portkey-AI/gateway

## Example usage

```bash
from openai import OpenAI

client = OpenAI(
  base_url="https://worker.helicone.ai/router/<HELICONE_ROUTER_ID_SLUG>",
  api_key="<HELICONE_API_KEY>",
)

completion = client.chat.completions.create(
  extra_headers={
    "Helicone-Property-Conversation-Source": "support",
    "Helicone-Property-App": "mobile",
  },
  model="openai/gpt-4o",
  messages=[
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ]
)

print(completion.choices[0].message.content)
```

# Implementation Plan

```
llm-proxy request lifecycle and flow:
0. Receive request.
1. Auth: extract Helicone key, API provider key, perform checks (RBAC)
2. Fetch+cache router config and other Helicone context (tower::Discover)
3. Build router based on user's router config.
4. Use router to route request to appropriate provider (tower::Service
   impl for each provider, boxed), which will dispatch the actual request to the
   provider.
   - impl A/B testing with tower::Balance
   - Use tower::retry for retries
   - Fallbacks if configured (the `Mapper<A, B>` struct will directly map
     types here using TryConvert)
5. In the request dispatcher, convert to concrete types if redirecting to
   a different provider, so that the request can be mapped to the other
   provider's request type. Then proxy request.
6. Return response to client
7. Log request/response via Kafka + S3

```