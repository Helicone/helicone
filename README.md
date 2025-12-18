<div align="center">

| 🔍 Observability | 🕸️ Agent Tracing | 🚂 LLM Routing |
| :--------------: | :--------------: | :------------------: |
|  💰 Cost & Latency Tracking  |   📚 Datasets & Fine-tuning    |    🎛️ Automatic Fallbacks   |

</div>

<p align="center" style="margin: 0; padding: 0;">
  <img alt="helicone logo" src="https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/Twitter_Cover_A1.png" style="display: block; margin: 0; padding: 0;">
</p>
</br>

<p align="center">
  <a href='https://github.com/helicone/helicone/graphs/contributors'><img src='https://img.shields.io/github/contributors/helicone/helicone?style=flat-square' alt='Contributors' /></a>
  <a href='https://github.com/helicone/helicone/stargazers'><img alt="GitHub stars" src="https://img.shields.io/github/stars/helicone/helicone?style=flat-square"/></a>
  <a href='https://github.com/helicone/helicone/pulse'><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/helicone/helicone?style=flat-square"/></a>
  <a href='https://github.com/helicone/helicone/issues?q=is%3Aissue+is%3Aclosed'><img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/helicone/helicone?style=flat-square"/></a>
  <a href='https://www.ycombinator.com/companies/helicone'><img alt="Y Combinator" src="https://img.shields.io/badge/Y%20Combinator-Helicone-orange?style=flat-square"/></a>
</p>
<p align="center">
  <a href="https://docs.helicone.ai/">Docs</a> • <a href="https://www.helicone.ai/changelog">Changelog</a> • <a href="https://github.com/helicone/helicone/issues">Bug reports</a> • <a href="https://helicone.ai/demo">See Helicone in Action! (Free)</a>
</p>

## Helicone is an AI Gateway & LLM Observability Platform for AI Engineers

- 🌐 **AI Gateway**: Access 100+ AI models with 1 API key through the OpenAI API with intelligent routing and automatic fallbacks. [Get started in 2 minutes.](https://docs.helicone.ai/gateway/overview)
- 🔌 **Quick integration**: One-line of code to log all your requests from [OpenAI](https://www.helicone.ai/models?providers=openai), [Anthropic](https://www.helicone.ai/models?providers=anthropic), [LangChain](https://docs.helicone.ai/gateway/integrations/langchain), [Gemini](https://www.helicone.ai/models?providers=gemini%2Cgoogle-ai-studio), [Vercel AI SDK](https://docs.helicone.ai/gateway/integrations/vercel-ai-sdk), and [more](https://docs.helicone.ai/gateway/overview).
- 📊 **Observe**: Inspect and debug traces & [sessions](https://docs.helicone.ai/features/sessions) for agents, chatbots, document processing pipelines, and more
- 📈 **Analyze**: Track metrics like [cost](https://docs.helicone.ai/faq/how-we-calculate-cost#developer), latency, quality, and more. Export to [PostHog](https://docs.helicone.ai/getting-started/integration-method/posthog) in one-line for custom dashboards
- 🎮 **Playground**: Rapidly test and iterate on prompts, sessions and traces in our UI.
- 🧠 **Prompt Management**: [Version prompts](https://docs.helicone.ai/features/prompts) using production data. Deploy prompts through the AI Gateway without code changes. Your prompts remain under your control, always accessible.
- 🎛️ **Fine-tune**: Fine-tune with one of our fine-tuning partners: [OpenPipe](https://openpipe.ai/) or [Autonomi](https://www.autonomi.ai/) (more coming soon)
- 🛡️ **Enterprise Ready**: SOC 2 and GDPR compliant

> 🎁 Generous monthly [free tier](https://www.helicone.ai/pricing) (10k requests/month) - No credit card required!
>
<img src="https://github.com/user-attachments/assets/e16332e9-d642-427e-b3ce-1a74a17f7b2c" alt="Open Sourced LLM Observability & AI Gateway Platform" width="600">

## Quick Start ⚡️

1. Get your API key by signing up [here](https://helicone.ai/signup) and add credits at [helicone.ai/credits](https://us.helicone.ai/credits)

2. Update the `baseURL` in your code and add your API key.

   ```typescript
   import OpenAI from "openai";

   const client = new OpenAI({
     baseURL: "https://ai-gateway.helicone.ai",
     apiKey: process.env.HELICONE_API_KEY,
   });

   const response = await client.chat.completions.create({
     model: "gpt-4o-mini",  // claude-sonnet-4, gemini-2.0-flash or any model from https://www.helicone.ai/models
     messages: [{ role: "user", content: "Hello!" }]
   });
   ```

3. 🎉 You're all set! View your logs at [Helicone](https://us.helicone.ai/dashboard) and access 100+ models through one API.

### Self-Hosting Open Source LLM Observability

#### Docker

Helicone is simple to self-host and update. To get started locally, just use our [docker-compose](https://docs.helicone.ai/getting-started/self-deploy-docker) file.

```bash
# Clone the repository
git clone https://github.com/Helicone/helicone.git
cd docker
cp .env.example .env

# Start the services
./helicone-compose.sh helicone up
```

#### Helm

For Enterprise workloads, we also have a production-ready Helm chart available. To access, contact us at enterprise@helicone.ai.

#### Manual (Not Recommended)

Manual deployment is not recommended. Please use Docker or Helm. If you must, follow the instructions [here](https://docs.helicone.ai/getting-started/self-deploy).

#### Architecture

Helicone is comprised of five services:

- **Web**: Frontend Platform (NextJS)
- **Worker**: Proxy Logging (Cloudflare Workers)
- **Jawn**: Dedicated Server for serving collecting logs (Express + Tsoa)
- **Supabase**: Application Database and Auth
- **ClickHouse**: Analytics Database
- **Minio**: Object Storage for logs.

## Integrations 🔌

### Inference Providers

| Integration                                                                            | Supports                                                                                                                                     | Description                                           |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| AI Gateway                                | [JS/TS, Python, cURL](https://docs.helicone.ai/gateway/overview)                                                                                                                          | Unified API for 100+ providers with intelligent routing, automatic fallbacks, and unified observability
| Async Logging (OpenLLMetry)                                                            | [JS/TS](https://docs.helicone.ai/getting-started/integration-method/openllmetry), [Python](https://www.npmjs.com/package/@helicone/helicone) | Asynchronous logging for multiple LLM platforms       |
| OpenAI                                                                                 | [JS/TS, Python](https://www.helicone.ai/models?providers=openai)              | Inference provider                                                     |
| Azure OpenAI                                                                           | [JS/TS, Python](https://www.helicone.ai/models?providers=azure)                | Inference provider                                                     |
| Anthropic                                                                              | [JS/TS, Python](https://www.helicone.ai/models?search=anthropic)        | Inference provider                                                     |
| Ollama                                                                                 | [JS/TS](https://docs.helicone.ai/integrations/ollama/javascript)                                                                             | Run and use large language models locally             |
| AWS Bedrock                                                                            | [JS/TS](https://www.helicone.ai/models?providers=azure%2Cbedrock)                                                                            | Inference provider                                                     |
| Gemini API                                                                             | [JS/TS](https://www.helicone.ai/models?providers=google-ai-studio)                                                                         | Inference provider                                                     |
| Gemini Vertex AI                                                                       | [JS/TS](https://www.helicone.ai/models?providers=vertex)                                                                      | Gemini models on Google Cloud's Vertex AI             |
| Vercel AI                                                                              | [JS/TS](https://docs.helicone.ai/gateway/integrations/vercel-ai-sdk)                                                                           | AI SDK for building AI-powered applications           |
| Anyscale | [JS/TS, Python](https://www.helicone.ai/models?providers=anyscale)                                                                                                                                | Inference provider                                                     |
| TogetherAI | [JS/TS, Python](https://www.helicone.ai/models?providers=together)     | Inference provider                                                                                                                                | -                                                     |
| Hyperbolic | [JS/TS, Python](https://www.helicone.ai/models?providers=hyperbolic)   | Inference provider                                                                                                                                | High-performance AI inference platform                |
| Groq                                                                                   | [JS/TS, Python](https://www.helicone.ai/models?providers=groq)                  | High-performance models                               |
| DeepInfra     | [JS/TS, Python](https://www.helicone.ai/models?providers=deepinfra)                                                                                                                                | Serverless AI inference for various models            |       |
| Fireworks AI  | [JS/TS, Python](https://www.helicone.ai/models?providers=fireworks)                                                                                                                                | Fast inference API for open-source LLMs               |

### Frameworks

| Framework                                                             | Supports                                                            | Description                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| LangChain   | [JS/TS, Python](https://www.helicone.ai/models?providers=langchain)                                                       | Use AI Gateway with LangChain for unified provider access                               |
| LlamaIndex | [Python](https://www.helicone.ai/models?providers=llamaindex)                                                              | Framework for building LLM-powered data applications                                    |
| LangGraph   | [Python](https://www.helicone.ai/models?providers=langgraph)                                                              | Build stateful, multi-actor applications with LLMs                                       |
| Vercel AI SDK | [JS/TS](https://www.helicone.ai/models?providers=vercel-ai-sdk)                                                               | AI SDK for building AI-powered applications                                              |
| Semantic Kernel | [C#, Python](https://www.helicone.ai/models?providers=semantic-kernel)                                                          | Microsoft's AI orchestration framework                                                  |
| CrewAI         | [Python](https://docs.helicone.ai/integrations/openai/crewai)                                                                   | Framework for orchestrating role-playing AI agents                                      |                                                           |
| ModelFusion                            | [JS/TS](https://github.com/vercel/modelfusion/blob/main/docs/integration/observability/helicone.md) | Abstraction layer for integrating AI models into JavaScript and TypeScript applications |
| PostHog | [JS/TS, Python, cURL](https://docs.helicone.ai/getting-started/integration-method/posthog) | Product analytics platform. Build custom dashboards.    |
| RAGAS                     | [Python](https://docs.helicone.ai/other-integrations/ragas) | Evaluation framework for retrieval-augmented generation |
| Open WebUI           | [JS/TS](https://docs.helicone.ai/other-integrations/open-webui) | Web interface for interacting with local LLMs           |
| MetaGPT                | [YAML](https://docs.helicone.ai/other-integrations/meta-gpt) | Multi-agent framework                                   |
| Open Devin           | [Docker](https://docs.helicone.ai/other-integrations/open-devin) | AI software engineer                                    |
| Mem0 EmbedChain      | [Python](https://docs.helicone.ai/other-integrations/embedchain) | Framework for building RAG applications                 |
| Dify                      | [No code required](https://docs.helicone.ai/other-integrations/dify) | LLMOps platform for AI-native application development   |

> This list may be out of date. Don't see your provider or framework? Check out the latest integrations in our [docs](https://docs.helicone.ai/gateway/integrations/overview). If not found there, request a new integration by contacting help@helicone.ai.

## Contributing

We ❤️ our contributors! We warmly welcome contributions for documentation, integrations, costs, and feature requests.

If you have an idea for how Helicone can be better, create a [GitHub issue](https://github.com/Helicone/helicone/issues).

## License

Helicone is licensed under the [Apache v2.0 License](LICENSE).

## Additional Resources

- **LLM Cost API**: We have the largest open-source API pricing database with 300+ models and providers such as OpenAI, Anthropic and more. [Start querying here.](https://www.helicone.ai/llm-cost)

- **Data Management**: Manage and export your Helicone data with our [API](https://docs.helicone.ai/rest/user/post-v1userquery) or access it with our [MCP server](https://docs.helicone.ai/integrations/tools/mcp).

  - Guides: [ETL](https://docs.helicone.ai/use-cases/etl), [Request Exporting](https://docs.helicone.ai/use-cases/getting-user-requests)

- **Data Ownership**: Learn about [Data Ownership and Autonomy](https://docs.helicone.ai/use-cases/data-autonomy)

For more information, visit our [documentation](https://docs.helicone.ai/).

# Contributors

<a href="https://github.com/Helicone/helicone/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Helicone/helicone" />
</a>
