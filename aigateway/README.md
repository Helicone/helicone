![Helicone AI Gateway](https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/github-w%3Alogo.png)

# Helicone AI Gateway

[![GitHub stars](https://img.shields.io/github/stars/Helicone/aia-gateway?style=for-the-badge)](https://github.com/helicone/aia-gateway/)
[![Downloads](https://img.shields.io/github/downloads/Helicone/aia-gateway/total?style=for-the-badge)](https://github.com/helicone/aia-gateway/releases)
[![Docker pulls](https://img.shields.io/docker/pulls/helicone/ai-gateway?style=for-the-badge)](https://hub.docker.com/r/helicone/ai-gateway)
[![License](https://img.shields.io/badge/license-APACHE-green?style=for-the-badge)](LICENSE)

**The fastest, lightest, and most powerful AI Gateway on the market.**

*Built by the team at [Helicone](https://helicone.ai), open-sourced for the community.*

[🚀 Quick Start](#-deploy-with-docker-in-seconds) • [📖 Docs](https://docs.helicone.ai/ai-gateway) • [💬 Discord](https://discord.gg/7aSCGCGUeu) • [🌐 Website](https://helicone.ai)

---

### 🚆 One line. 100+ models.

**Open-source, lightweight, and built on Rust.**

Handle hundreds of models and millions of LLM requests with minimal latency and maximum reliability.

The NGINX of LLMs.

---

## 👩🏻‍💻 Set up in seconds

1. Set up your `.env` file with your `PROVIDER_API_KEY`s

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

2. Run locally in your terminal
```bash
npx @helicone/ai-gateway start
```

3. Make your requests using any OpenAI SDK:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/production"
)

# Route to any LLM provider through the same interface, we handle the rest.
response = client.chat.completions.create(
    model="anthropic/claude-3-5-sonnet",  # Or openai/gpt-4o, gemini/gemini-2.5-pro, etc.
    messages=[{"role": "user", "content": "Hello from Helicone AI Gateway!"}]
)
```

**That's it.** No new SDKs to learn, no integrations to maintain. Fully-featured and open-sourced.

*-- For advanced config, check out our [configuration guide](https://docs.helicone.ai/ai-gateway/config) and the [providers we support](https://docs.helicone.ai/ai-gateway/providers).*

---

## Why Helicone AI Gateway?

<!-- TODO: include launch video here -->

#### 🌐 **Unified interface**
Request **any LLM provider** using familiar OpenAI syntax. Stop rewriting integrations—use one API for OpenAI, Anthropic, Google, AWS Bedrock, and [20+ more providers](https://docs.helicone.ai/ai-gateway/providers).

#### ⚡ **Smart provider selection**
**Load balance** to always hit the fastest, cheapest, or most reliable option. Built-in strategies include latency-based P2C + PeakEWMA, weighted distribution, and cost optimization. Always aware of provider uptime and rate limits.

#### 💰 **Control your spending**
**Rate limit** to prevent runaway costs and usage abuse. Set limits per user, team, or globally with support for request counts, token usage, and dollar amounts.

#### 🚀 **Improve performance**
**Cache responses** to reduce costs and latency by up to 95%. Supports Redis and S3 backends with intelligent cache invalidation.

#### 📊 **Simplified tracing**
Monitor performance and debug issues with built-in Helicone integration, plus OpenTelemetry support for **logs, metrics, and traces**.

#### ☁️ **One-click deployment**
Deploy in seconds to your own infrastructure by using our **Docker** or **binary** download following our [deployment guides](https://docs.helicone.ai/gateway/deployment).

---

## 🎥 Demo

<!-- TODO: Add demo GIF/video showing Helicone AI Gateway routing between providers -->

![Helicone AI Gateway Demo](https://via.placeholder.com/800x400/0ea5e9/ffffff?text=Helicone+AI+Gateway+Demo+%28Coming+Soon%29)

*Coming soon: Interactive demo showing real-time load balancing across providers*

---

## ⚡ Scalable for production

<!-- TODO: include correct metrics -->

| Metric | Helicone AI Gateway | Typical Setup | Improvement |
|--------|-------|---------------|-------------|
| **P95 Latency** | ~1-5ms | ~60-100ms | **10-100x faster** |
| **Memory Usage** | ~64MB | ~512MB | **8x lower** |
| **Requests/sec** | ~10,000 | ~1,000 | **10x throughput** |
| **Binary Size** | ~15MB | ~200MB | **13x smaller** |
| **Cold Start** | ~100ms | ~2s | **20x faster** |

---

## 🏗️ How it works

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your App      │───▶│ Helicone AI     │───▶│  LLM Providers  │
│                 │    │ Gateway         │    │                 │
│ OpenAI SDK      │    │                 │    │ • OpenAI        │
│ (any language)  │    │ • Load Balance  │    │ • Anthropic     │
│                 │    │ • Rate Limit    │    │ • AWS Bedrock   │
│                 │    │ • Cache         │    │ • Google Vertex │
│                 │    │ • Trace         │    │ • 20+ more      │
│                 │    │ • Fallbacks     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ Helicone        │
                      │ Observability   │
                      │                 │
                      │ • Dashboard     │
                      │ • Observability │
                      │ • Monitoring    │
                      │ • Debugging     │
                      └─────────────────┘
```

---

## ⚙️ Custom configuration

### Environment variables
Include your `PROVIDER_API_KEY`s in your `.env` file.

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
HELICONE_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
```

### Sample config file

*Note: This is a sample `config.yaml` file. Please refer to our [configuration guide](https://docs.helicone.ai/gateway/configuration) for the full list of options, examples, and defaults.*
*See our [full provider list here.](https://docs.helicone.ai/gateway/providers)*

```yaml
providers: # Include their PROVIDER_API_KEY in .env file
  openai:
    models:
      - gpt-4
      - gpt-4o
      - gpt-4o-mini

  anthropic:
    version: "2023-06-01"
    models:
      - claude-3-opus
      - claude-3-sonnet

global: # Global settings for all routers
  cache:
    enabled: true
    directive: "max-age=3600, max-stale=1800"
    buckets: 10
    seed: "unique-cache-seed"

routers:
  production: # Per router configuration
    load-balance:
      chat:
        strategy: latency
        targets:
          - openai
          - anthropic
    retries:
      enabled: true
        max-retries: 3
        strategy: exponential
        base: 1s
        max: 30s
    rate-limit:
      global:
        store: in-memory
        per-api-key:
          capacity: 500
          refill-frequency: 1s
        cleanup-interval: 5m
    helicone: # Include your HELICONE_API_KEY in your .env file
      enable: true
    telemetry:
      level: "info,llm_proxy=trace"
```
### Run with your custom config file

```bash
npx @helicone/ai-gateway start --config config.yaml
```
---

## 📚 Migration guide

### From OpenAI
```diff
from openai import OpenAI

client = OpenAI(
-   api_key=os.getenv("OPENAI_API_KEY")
+   base_url="http://localhost:8080/production"
)

# No other changes needed!
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### From LangChain
```diff
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o",
-   api_key=os.getenv("OPENAI_API_KEY")
+   base_url="http://localhost:8080/"
)
```

### From multiple providers
```python
# Before: Managing multiple clients
openai_client = OpenAI(api_key=openai_key)
anthropic_client = Anthropic(api_key=anthropic_key)

# After: One client for everything
client = OpenAI(
    base_url="http://localhost:8080/production"
)

# Use any model through the same interface
gpt_response = client.chat.completions.create(model="gpt-4o", ...)
claude_response = client.chat.completions.create(model="claude-3-5-sonnet", ...)
```

---

## 💗 What they say about The Helicone AI Gateway

> *"The Helicone AI Gateway reduced our LLM integration complexity from 15 different SDKs to just one. We're now spending time building features instead of maintaining integrations."*
>
> — **Senior Engineer, Fortune 500 Company**

> *"The cost optimization alone saved us $50K/month. The unified observability is just a bonus."*
>
> — **CTO, AI Startup**

> *"We went from 200ms P95 latency to 50ms with smart caching and load balancing. Our users immediately noticed."*
>
> — **Staff Engineer, SaaS Platform**

*Want to be featured? [Share your story!](https://github.com/Helicone/aia-gateway/discussions)*

---

## 📚 Resources

<!-- TODO: include correct resources -->

### Documentation
- 📖 **[Full Documentation](https://docs.helicone.ai/ai-gateway)** - Complete guides and API reference
- 🚀 **[Quickstart Guide](https://docs.helicone.ai/ai-gateway/quickstart)** - Get up and running in 1 minute
- 🔬 **[Advanced Configurations](https://docs.helicone.ai/ai-gateway/config)** - Configuration reference & examples

### Community
- 💬 **[Discord Server](https://discord.gg/7aSCGCGUeu)** - Our community of passionate AI engineers
- 🐙 **[GitHub Discussions](https://github.com/helicone/ai-gateway/discussions)** - Q&A and feature requests
- 🐦 **[Twitter](https://twitter.com/helicone_ai)** - Latest updates and announcements
- 📧 **[Newsletter](https://helicone.ai/email-signup)** - Tips and tricks to deploying AI applications

### Support
- 🎫 **[Report bugs](https://github.com/helicone/ai-gateway/issues)**: Github issues
- 💼 **[Enterprise Support](https://helicone.ai/contact)**: Contact sales

---

## 📄 License

The Helicone AI Gateway is licensed under the [Apache License](LICENSE) - see the file for details.

---

**Made with ❤️ by [Helicone](https://helicone.ai).**

[Website](https://helicone.ai) • [Docs](https://docs.helicone.ai) • [Discord](https://discord.gg/7aSCGCGUeu) • [Twitter](https://twitter.com/helicone_ai)
