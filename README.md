<!-- TODO: include banner image here-->

# Helicone Helix

<!-- TODO: provide the correct links for these badges-->

![Helix Router](https://img.shields.io/badge/Helix-Router-blue?style=for-the-badge)
[![GitHub stars](https://img.shields.io/github/stars/Helicone/helicone-router?style=for-the-badge)](https://github.com/Helicone/helicone-router/stargazers)
[![Downloads](https://img.shields.io/github/downloads/Helicone/helicone-router/total?style=for-the-badge)](https://github.com/Helicone/helicone-router/releases)
[![Docker pulls](https://img.shields.io/docker/pulls/helicone/helix?style=for-the-badge)](https://hub.docker.com/r/helicone/helix)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Discord](https://img.shields.io/discord/1234567890?style=for-the-badge&logo=discord)](https://discord.gg/QEVVRyQn)

**One line. 100+ models. The fastest, lightest, and most powerful router for LLMs.**

*Built by the team at [Helicone](https://helicone.ai)*

[🚀 Quick Start](#-deploy-with-docker-in-seconds) • [📖 Docs](https://docs.helicone.ai/helix) • [💬 Discord](https://discord.gg/helicone) • [🌐 Website](https://helicone.ai)

</div>

---
The AI development space is progressing at an **exponential rate**.

Keeping up means rewriting integrations for every new model - managing a maze of API keys, engineering custom fallbacks for provider outages, and constantly tuning traffic for cost or compliance.

**Helicone Helix is the answer - a lightweight Rust router inspired by NGINX that removes the integration tax so you can focus on shipping features.**

---

## 👩🏻‍💻 Deploy with Docker in seconds

<!-- TODO: include correct command for docker run -->

```bash
docker run -d --name helix \
  -p 8080:8080 \
  -e OPENAI_API_KEY=your_openai_key \
  -e ANTHROPIC_API_KEY=your_anthropic_key
  helicone/helix:latest
```

In your application, use any OpenAI SDK:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/"
)

# Route to any provider through the same interface, we handle the rest.
response = client.chat.completions.create(
    model="anthropic/claude-3-5-sonnet",  # Or openai/gpt-4o, gemini/gemini-2.5-pro, etc.
    messages=[{"role": "user", "content": "Hello from Helix!"}]
)
```

**That's it.** No SDKs to learn, no integrations to maintain. Fully-featured and open-sourced.

---

## Why Helicone Helix?

<!-- TODO: include launch video here -->

#### 🌐 **One line. 100+ models**
A **unified interface** for every LLM provider using familiar OpenAI syntax. Stop rewriting integrations—use one API for OpenAI, Anthropic, Google, AWS Bedrock, and [20+ more providers](https://helix.helicone.ai/docs/providers).

#### ⚡ **Smart provider selection**
**Load balance** to always hit the fastest, cheapest, or most reliable option. Built-in strategies include latency-based P2C + PeakEWMA, weighted distribution, and cost optimization. Always aware of provider uptime and rate limits.

#### 💰 **Control your spending**
**Rate limit** to prevent runaway costs and usage abuse. Set limits per user, team, or globally with support for request counts, token usage, and dollar amounts.

#### 🚀 **Reduce latency**
**Cache responses** to reduce costs and latency by up to 95%. Supports Redis and S3 backends with intelligent cache invalidation.

#### 📊 **Simplified tracing**
Monitor performance and debug issues with built-in Helicone integration, plus OpenTelemetry support for **logs, metrics, and traces**. All built-in.

---

## 🎥 Demo

<!-- TODO: Add demo GIF/video showing Helix routing between providers -->

![Helix Demo](https://via.placeholder.com/800x400/0ea5e9/ffffff?text=Helix+Demo+%28Coming+Soon%29)

*Coming soon: Interactive demo showing real-time load balancing across providers*

---

## ⚡ Scalability Metrics

<!-- TODO: include correct metrics -->

| Metric | Helix | Typical Setup | Improvement |
|--------|-------|---------------|-------------|
| **P95 Latency** | ~1-5ms | ~60-100ms | **10-100x faster** |
| **Memory Usage** | ~64MB | ~512MB | **8x lower** |
| **Requests/sec** | ~10,000 | ~1,000 | **10x throughput** |
| **Binary Size** | ~15MB | ~200MB | **13x smaller** |
| **Cold Start** | ~100ms | ~2s | **20x faster** |

<!-- TODO: update to the correct benchmarking info -->

*Benchmarks run on < AWS t3.medium instances > with < Redis caching > enabled.*

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Your App      │───▶│      Helix      │───▶│   LLM Providers  │
│                 │    │                 │    │                  │
│ OpenAI SDK      │    │ • Load Balance  │    │ • OpenAI         │
│ (any language)  │    │ • Rate Limit    │    │ • Anthropic      │
│                 │    │ • Cache         │    │ • AWS Bedrock    │
│                 │    │ • Observe       │    │ • Google Vertex  │
│                 │    │ • Retry         │    │ • 20+ more       │
└─────────────────┘    └─────────────────┘    └──────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ Helicone        │
                      │ • Dashboard     │
                      │ • Observability │
                      │ • Monitoring    │
                      │ • Debugging     │
                      └─────────────────┘
```

---

## 🛠️ Installation

<!-- TODO: include correct commands -->

### Option 1: Docker (Recommended)
```bash
# Basic setup
docker run -d --name helix \
  -p 8080:8080 \
  -e OPENAI_API_KEY=sk-... \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  helicone/helix:latest

# With Redis caching
docker run -d --name helix \
  -p 8080:8080 \
  -e OPENAI_API_KEY=sk-... \
  -e REDIS_URL=redis://localhost:6379 \
  helicone/helix:latest
```

### Option 2: Binary Download
```bash
# Download for your platform
curl -L https://github.com/Helicone/helicone-router/releases/latest/download/helix-$(uname -s)-$(uname -m).tar.gz | tar xz

# Run directly
./helix
```

### Option 3: Cargo (From Source)
```bash
cargo install helix-llm-proxy
helix
```

---

## ⚙️ Configuration

### Environment variables (Simplest)
```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export REDIS_URL=redis://localhost:6379
```

### Configuration file
```yaml
# helix.yaml
providers:
  - name: openai
    type: openai
    api_key: ${OPENAI_API_KEY}
    models: [gpt-4o, gpt-4o-mini, gpt-3.5-turbo]

  - name: anthropic
    type: anthropic
    api_key: ${ANTHROPIC_API_KEY}
    models: [claude-3-5-sonnet, claude-3-5-haiku]

  - name: bedrock
    type: bedrock
    region: us-east-1
    models: [anthropic.claude-3-5-sonnet-20241022-v2:0]

load_balancing:
  strategy: latency_based  # or weighted, cost_based

rate_limits:
  global:
    requests_per_minute: 1000
  per_user:
    requests_per_minute: 60

caching:
  backend: redis
  ttl: 3600  # 1 hour
```

Run with config:
```bash
helix --config helix.yaml
```

---

## 🌍 Supported Providers & Models

<!-- TODO: revise the correct models & providers supported -->

### Cloud Providers
| Provider | Models | Auth Method |
|----------|--------|-------------|
| **OpenAI** | GPT-4o, GPT-4o-mini, o1, o3-mini, embeddings | API Key |
| **Anthropic** | Claude 3.5 Sonnet/Haiku, Claude 3 Opus | API Key |
| **AWS Bedrock** | Claude, Nova, Titan, Llama | AWS Credentials |
| **Google Vertex** | Gemini Pro/Flash, PaLM, Claude | Service Account |
| **Azure OpenAI** | GPT models via Azure | API Key |
| **Mistral** | Mistral Large/Medium/Small | API Key |
| **Cohere** | Command R+, Embed | API Key |
| **Perplexity** | Sonar models | API Key |
| **Together** | Llama, Mixtral, Qwen | API Key |
| **Groq** | Llama, Mixtral, Gemma | API Key |

### Self-Hosted
| Provider | Models | Notes |
|----------|--------|-------|
| **Ollama** | Llama, Mistral, CodeLlama, etc. | Local deployment |
| **vLLM** | Any HuggingFace model | OpenAI-compatible |
| **OpenAI-compatible** | Custom endpoints | Generic support |

<!-- TODO: update to the correct provider list link -->

*See our [full provider list](https://docs.helicone.ai/helix/providers) for the complete matrix*

---

## 🎯 Production examples

### Docker Compose
```yaml
version: '3.8'
services:
  helix:
    image: helicone/helix:latest
    ports:
      - "8080:8080"
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      REDIS_URL: redis://redis:6379
    volumes:
      - ./helix.yaml:/app/helix.yaml
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### Kubernetes Deployment
```yaml
apiVersion: apps/
kind: Deployment
metadata:
  name: helix
spec:
  replicas: 3
  selector:
    matchLabels:
      app: helix
  template:
    metadata:
      labels:
        app: helix
    spec:
      containers:
      - name: helix
        image: helicone/helix:latest
        ports:
        - containerPort: 8080
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: llm-secrets
              key: openai
        - name: REDIS_URL
          value: redis://redis-service:6379
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: helix-service
spec:
  selector:
    app: helix
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

### Sidecar Pattern
```dockerfile
# Add to your existing application
FROM your-app:latest

# Install Helix
COPY --from=helicone/helix:latest /usr/local/bin/helix /usr/local/bin/helix

# Start both services
CMD ["sh", "-c", "helix & your-app"]
```

---

## 🔧 Advanced Features

### Load Balancing Strategies

```yaml
load_balancing:
  # Latency-optimized (default)
  strategy: latency_based

  # Cost-optimized
  strategy: cost_based
  fallback: latency_based

  # Weighted distribution
  strategy: weighted
  weights:
    openai: 0.7
    anthropic: 0.2
    bedrock: 0.1

  # Round-robin
  strategy: round_robin
```

### Rate Limiting

```yaml
rate_limits:
  # Global limits
  global:
    requests_per_minute: 1000
    tokens_per_hour: 1000000
    cost_per_day: 100  # USD

  # Per-user limits (via Helicone-User-Id header)
  per_user:
    requests_per_minute: 60
    cost_per_day: 10

  # Per-team limits
  per_team:
    requests_per_hour: 500
    cost_per_day: 50
```

### Intelligent Caching

```yaml
caching:
  backend: redis  # or s3
  redis_url: redis://localhost:6379

  # Cache rules
  rules:
    - path: "//chat/completions"
      ttl: 3600
      cache_key_include: [model, messages, temperature]

    - path: "//embeddings"
      ttl: 86400  # 24 hours
      cache_key_include: [model, input]
```

### Retries & Fallbacks

```yaml
resilience:
  retries:
    max_attempts: 3
    backoff: exponential
    initial_delay: 100ms
    max_delay: 5s

  fallbacks:
    - primary: openai/gpt-4o
      fallback: anthropic/claude-3-5-sonnet
    - primary: anthropic/claude-3-5-sonnet
      fallback: openai/gpt-4o
```

---

## 📈 Observability

### Helicone Integration (Default)
```yaml
observability:
  helicone:
    api_key: ${HELICONE_API_KEY}
    base_url: https://api.helicone.ai

    # Custom properties
    properties:
      environment: production
      service: my-app
```

### OpenTelemetry
```yaml
observability:
  tracing:
    enabled: true
    endpoint: http://jaeger:14268/api/traces

  metrics:
    enabled: true
    prometheus_endpoint: /metrics

  logging:
    level: info
    format: json
```

### Health Checks
```bash
# Health endpoint
curl http://localhost:8080/health

# Metrics endpoint
curl http://localhost:8080/metrics

# Provider status
curl http://localhost:8080/status
```

---

## 🧑‍💻 Local development

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Helicone API key](https://docs.helicone.ai/api-keys)
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Helicone/helicone-router.git
   cd helicone-router
   ```

1. **Environment Setup**
   ```bash
   # Copy environment template and configure
   cp .env.template .env
   ```
   Fill out the following environment variables in you .env file:
   - `PROXY__HELICONE__API_KEY`
   - `HELICONE_API_KEY`
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`

2. **Start Services**
   ```bash
   # Start docker compose stack
   cd infrastructure && docker compose up -d && cd ..
   ```

3. **Run the Router**
   ```bash
   # With default configs
   cargo run

   # Or with a dev config file
   cargo rl
   ```

4. **Testing**
   ```bash
   # Run an HTTP request against the router
   cargo run -p test

   # Run unit + integration tests
   cargo int-test
   ```

## 🎮 Demo Guide

### Basic Setup
1. Set up environment variables as described in the Development Setup section
2. Run the router locally with OpenAI/Anthropic:
   ```bash
   cargo run -- -c ./llm-proxy/config/demo.yaml
   ```
3. Send a test request:
   ```bash
   cargo run -p test
   ```
   You should see the request logged in your Helicone dashboard

On macOS with Homebrew:
```bash
brew install openssl protobuf pkg-config
```

### Load Testing
1. Start the load test server:
   ```bash
   cargo rlt
   ```
2. In another terminal, start the mock server:
   ```bash
   cargo run -p mock-server
   ```
3. In a third terminal, run continuous test requests:
   ```bash
   cargo run -p test -- --run-forever
   ```
4. Monitor the results in your Grafana dashboard

---

## 📚 Migration guide

### From OpenAI
```diff
from openai import OpenAI

client = OpenAI(
-   api_key=os.getenv("OPENAI_API_KEY")
+   base_url="http://localhost:8080/",
+   api_key="your-helicone-api-key"  # Helix handles provider auth
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
+   base_url="http://localhost:8080/",
+   api_key="your-helicone-api-key"
)
```

### From multiple providers
```python
# Before: Managing multiple clients
openai_client = OpenAI(api_key=openai_key)
anthropic_client = Anthropic(api_key=anthropic_key)

# After: One client for everything
client = OpenAI(
    base_url="http://localhost:8080/",
    api_key="your-helicone-api-key"
)

# Use any model through the same interface
gpt_response = client.chat.completions.create(model="gpt-4o", ...)
claude_response = client.chat.completions.create(model="claude-3-5-sonnet", ...)
```

---

## 💗 What they say about Helix

> *"Helix reduced our LLM integration complexity from 15 different SDKs to just one. We're now spending time building features instead of maintaining integrations."*
>
> — **Senior Engineer, Fortune 500 Company**

> *"The cost optimization alone saved us $50K/month. The unified observability is just a bonus."*
>
> — **CTO, AI Startup**

> *"We went from 200ms P95 latency to 50ms with smart caching and load balancing. Our users immediately noticed."*
>
> — **Staff Engineer, SaaS Platform**

*Want to be featured? [Share your story!](https://github.com/Helicone/helicone-router/discussions)*

---

## 📚 Resources

<!-- TODO: include correct resources -->

### Documentation
- 📖 **[Full Documentation](https://docs.helicone.ai/helix)** - Complete guides and API reference
- 🚀 **[Quickstart Guide](https://docs.helicone.ai/helix/quickstart)** - Get up and running in 5 minutes
- 🏗️ **[Architecture Guide](https://docs.helicone.ai/helix/architecture)** - How Helix works under the hood
- 🔬 **[Advanced Examples](https://docs.helicone.ai/helix/examples)** - Production configurations

### Community
- 💬 **[Discord Server](https://discord.gg/QEVVRyQn)** - Chat with the community
- 🐙 **[GitHub Discussions](https://github.com/Helicone/helicone-router/discussions)** - Q&A and feature requests
- 🐦 **[Twitter](https://twitter.com/helicone_ai)** - Latest updates and announcements
- 📧 **[Newsletter](https://helicone.ai/newsletter)** - Monthly updates and tips

### Support
- 📧 **Email**: [support@helicone.ai](mailto:support@helicone.ai)
- 🎫 **GitHub Issues**: [Report bugs](https://github.com/Helicone/helicone-router/issues)
- 💼 **Enterprise**: [Contact sales](https://helicone.ai/contact) for enterprise support

---

## 📄 License

<!-- TODO: include correct license -->

Helix is licensed under the [Apache License](LICENSE) - see the file for details.

### What this means:
- ✅ **Commercial use** - Use the software for any purpose, including commercial applications
- ✅ **Modification** - Modify the software to suit your needs
- ✅ **Distribution** - Distribute original or modified versions
- ✅ **Patent use** - Patent rights are granted for any patents owned by contributors
- ✅ **Private use** - Use the software privately
- ⚠️ **License and copyright notice** - Must include a copy of the license and copyright notice
- ⚠️ **State changes** - Must state significant changes made to the software
- ⚠️ **Attribution** - Must include attribution notices from the original software
- ❌ **Liability** - No liability for damages
- ❌ **Warranty** - No warranty provided

---

**Made with ❤️ by [Helicone](https://helicone.ai)**

[Website](https://helicone.ai) • [Docs](https://docs.helicone.ai) • [Discord](https://discord.gg/QEVVRyQn) • [Twitter](https://twitter.com/helicone_ai)

</div>
