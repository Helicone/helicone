<p align="center" style="margin: 0; padding: 0;">
  <img alt="helicone logo" src="https://github.com/user-attachments/assets/71c5896d-85e1-44fd-a966-0ac27170e343" width="400" style="display: block; margin: 0; padding: 0;">
</p>

<div align="center">

| 🔍 Observability | 🕸️ Agent Tracing | 💬 Prompt Management |
| :--------------: | :--------------: | :------------------: |
|  📊 Evaluations  |   📚 Datasets    |    🎛️ Fine-tuning    |

</div>

<p align="center">
<img src="https://github.com/user-attachments/assets/e16332e9-d642-427e-b3ce-1a74a17f7b2c" alt="Open Source" width="600">
</a>
<p align="center">
  <a href="https://docs.helicone.ai/">Docs</a> • <a href="https://discord.gg/zsSTcH2qhG">Discord</a> • <a href="https://us.helicone.ai/roadmap">Roadmap</a> • <a href="https://www.helicone.ai/changelog">Changelog</a> • <a href="https://github.com/helicone/helicone/issues">Bug reports</a>
</p>
<p align="center">
  <em><a href="https://helicone.ai/demo">See Helicone in Action! (Free)</a></em>
</p>

<p align="center">
  <a href='https://github.com/helicone/helicone/graphs/contributors'><img src='https://img.shields.io/github/contributors/helicone/helicone?style=flat-square' alt='Contributors' /></a>
  <a href='https://github.com/helicone/helicone/stargazers'><img alt="GitHub stars" src="https://img.shields.io/github/stars/helicone/helicone?style=flat-square"/></a>
  <a href='https://github.com/helicone/helicone/pulse'><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/helicone/helicone?style=flat-square"/></a>
  <a href='https://github.com/helicone/helicone/issues?q=is%3Aissue+is%3Aclosed'><img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/helicone/helicone?style=flat-square"/></a>
  <a href='https://www.ycombinator.com/companies/helicone'><img alt="Y Combinator" src="https://img.shields.io/badge/Y%20Combinator-Helicone-orange?style=flat-square"/></a>
</p>

## Helicone is the all-in-one, open-source LLM developer platform

- 🔌 **Integrate**: One-line of code to log all your requests to [OpenAI](https://docs.helicone.ai/integrations/openai/javascript), [Anthropic](https://docs.helicone.ai/integrations/anthropic/javascript), [LangChain](https://docs.helicone.ai/integrations/openai/langchain), [Gemini](https://docs.helicone.ai/integrations/gemini/api/javascript), [TogetherAI](https://docs.helicone.ai/getting-started/integration-method/together), [LlamaIndex](https://docs.helicone.ai/integrations/openai/llamaindex), [LiteLLM](https://docs.helicone.ai/getting-started/integration-method/litellm), [OpenRouter](https://docs.helicone.ai/getting-started/integration-method/openrouter), and [more](https://docs.helicone.ai/getting-started/quick-start)
- 📊 **Observe**: Inspect and debug traces & [sessions](https://docs.helicone.ai/features/sessions) for agents, chatbots, document processing pipelines, and more
- 📈 **Analyze**: Track metrics like [cost](https://docs.helicone.ai/faq/how-we-calculate-cost#developer), latency, quality, and more. Export to [PostHog](https://docs.helicone.ai/getting-started/integration-method/posthog) in one-line for custom dashboards
- 🎮 **Playground**: Rapidly test and iterate on prompts, sessions and traces in our UI
- 🧠 **Prompt Management**: [Version and experiment with prompts](https://docs.helicone.ai/features/prompts) using production data. Your prompts remain under your control, always accessible.
- 🔍 **Evaluate**: Automatically run evals on traces or sessions using the latest platforms: [LastMile](https://lastmileai.dev/) or [Ragas](https://ragas.io/) (more coming soon)
- 🎛️ **Fine-tune**: Fine-tune with one of our fine-tuning partners: [OpenPipe](https://openpipe.ai/) or [Autonomi](https://www.autonomi.ai/) (more coming soon)
- 🛜 **Gateway**: [Caching](https://docs.helicone.ai/features/advanced-usage/caching), [custom rate limits](https://docs.helicone.ai/features/advanced-usage/custom-rate-limits), [LLM security](https://docs.helicone.ai/features/advanced-usage/llm-security), and more with our gateway
- 🛡️ **Enterprise Ready**: SOC 2 and GDPR compliant

> 🎁 Generous monthly [free tier](https://www.helicone.ai/pricing) (100k requests/month) - No credit card required!

## Quick Start ⚡️ One line of code

1. Get your `write-only` API key by signing up [here](helicone.ai/signup).

2. Update only the `baseURL` in your code:

   ```typescript
   import OpenAI from "openai";

   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
     baseURL: `https://oai.helicone.ai/v1/${process.env.HELICONE_API_KEY}`,
   });
   ```
  or - use headers for more secure environments

   ```typescript
   import OpenAI from "openai";

   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
     baseURL: `https://oai.helicone.ai/v1`,
     defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
     },
   });
   ```

3. 🎉 You're all set! View your logs at [Helicone](https://www.helicone.ai).

> This quick start uses Helicone Cloud with OpenAI. For other providers or self-hosted options, see below.

## Get Started For Free

### Helicone Cloud (Recommended)

The fastest and most reliable way to get started with Helicone. Get started for free at [Helicone US](https://us.helicone.ai/signup) or [Helicone EU](https://eu.helicone.ai/signup). Your first 100k requests are free every month, after which you'll [pay based on usage](https://www.helicone.ai/pricing). Try our [demo](https://helicone.ai/demo) to see Helicone in action!

**Integrations:** View our supported [integrations](#main-integrations).

**Latency Concerns:** [Helicone's Cloud offering](https://www.helicone.ai) is deployed on Cloudflare workers and ensures the lowest latency (~10ms) add-on to your API requests. View our [latency benchmarks](https://docs.helicone.ai/faq/latency-affect#latency-impact).

### Self-Hosting Open Source LLM Observability with Helicone

#### Docker

Helicone is simple to self-host and update. To get started locally, just use our [docker-compose](https://docs.helicone.ai/getting-started/self-deploy-docker) file.

Pre-Request:
- Copy the shared directory to the valhalla directory
- Create a valhalla folder in the valhalla directory and put /valhalla/jawn in it

```bash
# Clone the repository
git clone https://github.com/Helicone/helicone.git
cd docker
cp .env.example .env

# Start the services
docker compose up
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

### LLM Observability Integrations

### Main Integrations

| Integration                                                                            | Supports                                                                                                                                     | Description                                           |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [Generic Gateway](https://docs.helicone.ai/getting-started/integration-method/gateway) | Python, Node.js, Python w/package, LangChain JS, LangChain, cURL                                                                             | Flexible integration method for various LLM providers |
| Async Logging (OpenLLMetry)                                                            | [JS/TS](https://docs.helicone.ai/getting-started/integration-method/openllmetry), [Python](https://www.npmjs.com/package/@helicone/helicone) | Asynchronous logging for multiple LLM platforms       |
| OpenAI                                                                                 | [JS/TS](https://docs.helicone.ai/integrations/openai/javascript), [Python](https://docs.helicone.ai/integrations/openai/python)              | -                                                     |
| Azure OpenAI                                                                           | [JS/TS](https://docs.helicone.ai/integrations/azure/javascript), [Python](https://docs.helicone.ai/integrations/azure/python)                | -                                                     |
| Anthropic                                                                              | [JS/TS](https://docs.helicone.ai/integrations/anthropic/javascript), [Python](https://docs.helicone.ai/integrations/anthropic/python)        | -                                                     |
| Ollama                                                                                 | [JS/TS](https://docs.helicone.ai/integrations/ollama/javascript)                                                                             | Run and use large language models locally             |
| AWS Bedrock                                                                            | [JS/TS](https://docs.helicone.ai/integrations/bedrock/javascript)                                                                            | -                                                     |
| Gemini API                                                                             | [JS/TS](https://docs.helicone.ai/integrations/gemini/api/javascript)                                                                         | -                                                     |
| Gemini Vertex AI                                                                       | [JS/TS](https://docs.helicone.ai/integrations/gemini/vertex/javascript)                                                                      | Gemini models on Google Cloud's Vertex AI             |
| Vercel AI                                                                              | [JS/TS](https://docs.helicone.ai/integrations/vercelai/javascript)                                                                           | AI SDK for building AI-powered applications           |
| [Anyscale](https://docs.helicone.ai/getting-started/integration-method/anyscale)       | JS/TS, Python                                                                                                                                | -                                                     |
| [TogetherAI](https://docs.helicone.ai/getting-started/integration-method/together)     | JS/TS, Python                                                                                                                                | -                                                     |
| [Hyperbolic](https://docs.helicone.ai/getting-started/integration-method/hyperbolic)   | JS/TS, Python                                                                                                                                | High-performance AI inference platform                |
| Groq                                                                                   | [JS/TS](https://docs.helicone.ai/integrations/groq/javascript), [Python](https://docs.helicone.ai/integrations/groq/python)                  | High-performance models                               |
| [DeepInfra](https://docs.helicone.ai/getting-started/integration-method/deepinfra)     | JS/TS, Python                                                                                                                                | Serverless AI inference for various models            |
| [OpenRouter](https://docs.helicone.ai/getting-started/integration-method/openrouter)   | JS/TS, Python                                                                                                                                | Unified API for multiple AI models                    |
| [LiteLLM](https://docs.helicone.ai/getting-started/integration-method/litellm)         | JS/TS, Python                                                                                                                                | Proxy server supporting multiple LLM providers        |
| [Fireworks AI](https://docs.helicone.ai/getting-started/integration-method/fireworks)  | JS/TS, Python                                                                                                                                | Fast inference API for open-source LLMs               |

### Supported Frameworks

| Framework                                                             | Supports                                                            | Description                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [LangChain](https://docs.helicone.ai/integrations/openai/langchain)   | JS/TS, Python                                                       | -                                                                                       |
| [LlamaIndex](https://docs.helicone.ai/integrations/openai/llamaindex) | Python                                                              | Framework for building LLM-powered data applications                                    |
| [CrewAI](https://docs.helicone.ai/integrations/openai/crewai)         | -                                                                   | Framework for orchestrating role-playing AI agents                                      |
| Big-AGI                                                               | [JS/TS](https://github.com/enricoros/nextjs-chatgpt-app)            | Generative AI suite                                                                     |
| [ModelFusion](https://modelfusion.dev)                                | [JS/TS](https://modelfusion.dev/integration/observability/helicone) | Abstraction layer for integrating AI models into JavaScript and TypeScript applications |

### Other Integrations

| Integration                                                                    | Description                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| [PostHog](https://docs.helicone.ai/getting-started/integration-method/posthog) | Product analytics platform. Build custom dashboards.    |
| [RAGAS](https://docs.helicone.ai/other-integrations/ragas)                     | Evaluation framework for retrieval-augmented generation |
| [Open WebUI](https://docs.helicone.ai/other-integrations/open-webui)           | Web interface for interacting with local LLMs           |
| [MetaGPT](https://docs.helicone.ai/other-integrations/meta-gpt)                | Multi-agent framework                                   |
| [Open Devin](https://docs.helicone.ai/other-integrations/open-devin)           | AI software engineer                                    |
| [Mem0 EmbedChain](https://docs.helicone.ai/other-integrations/embedchain)      | Framework for building RAG applications                 |
| [Dify](https://docs.helicone.ai/other-integrations/dify)                       | LLMOps platform for AI-native application development   |

> This list may be out of date. Don't see your provider or framework? Check out the latest integrations in our [docs](https://docs.helicone.ai/getting-started/quick-start). If not found there, request a new integration by contacting help@helicone.ai.

## Community 🌍

### Learn this repo with Greptile

[learnthisrepo.com/helicone](https://learnthisrepo.com/helicone) |

### Contributing

We ❤️ our contributors! We warmly welcome contributions for documentation, integrations, costs, and feature requests.

- If you have an idea for how Helicone can be better, create a [GitHub issue](https://github.com/Helicone/helicone/issues) or vote on the [roadmap](https://github.com/Helicone/helicone/labels/roadmap)
- Update costs instructions in [costs/README.md](https://github.com/Helicone/helicone/blob/main/costs/README.md)
- Join [discord](https://discord.gg/zsSTcH2qhG) to ask questions

## License

Helicone is licensed under the [Apache v2.0 License](LICENSE).

## Additional Resources

- **Data Management**: Manage and export your Helicone data with our [API](https://docs.helicone.ai/rest/user/post-v1userquery).

  - Guides: [ETL](https://docs.helicone.ai/use-cases/etl), [Request Exporting](https://docs.helicone.ai/use-cases/getting-user-requests)

- **Data Ownership**: Learn about [Data Ownership and Autonomy](https://docs.helicone.ai/use-cases/data-autonomy)

For more information, visit our [documentation](https://docs.helicone.ai/).

# Contributors

<a href="https://github.com/Helicone/helicone/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Helicone/helicone" />
</a>
