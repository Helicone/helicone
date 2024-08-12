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
  <em><a href="https://helicone.ai/demo">See Helicone in Action!</a></em>
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

2. Add the following to your code:

   ```typescript
   import OpenAI from "openai";

   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
     baseURL: `https://oai.helicone.ai/v1/${process.env.HELICONE_API_KEY}`,
   });
   ```

3. 🎉 You're all set! View your logs at [Helicone](https://www.helicone.ai).

> This quick start uses Helicone Cloud with OpenAI. For other providers or self-hosted options, see below.

## Get Started For Free

### Helicone Cloud (Recommended)

The fastest and most reliable way to get started with Helicone. Get started for free at [Helicone US](https://us.helicone.ai/signup) or [Helicone EU](https://eu.helicone.ai/signup). Your first 100k requests are free every month, after which you'll [pay based on usage](https://www.helicone.ai/pricing). Try our [demo](https://helicone.ai/demo) to see Helicone in action!

**Latency concerns?** [Helicone's Cloud offering](https://www.helicone.ai) is deployed on Cloudflare workers and ensures the lowest latency (~10ms) add-on to your API requests. View our [latency benchmarks](https://docs.helicone.ai/faq/latency-affect#latency-impact).

### Self-Hosting Open Source LLM Observability with Helicone

Helicone is simple to self-host and update. To get started locally, just use our [docker-compose](https://docs.helicone.ai/getting-started/self-deploy-docker) file.

```bash
# Clone the repository
git clone https://github.com/Helicone/helicone.git
cd docker
cp .env.example .env

# Start the services
docker compose up
```

For Enterprise workloads, we also have a production-ready Helm chart available. To access, contact us at enterprise@helicone.ai.

Helicone is comprised of five services:

- **Web**: Frontend Platform (NextJS)
- **Worker**: Proxy Logging (Cloudflare Workers)
- **Jawn**: Dedicated Server for serving collecting logs (Express + Tsoa)
- **Supabase**: Application Database and Auth
- **ClickHouse**: Analytics Database
- **Minio**: Object Storage for logs.

If you have any questions, contact help@helicone.ai or join [discord](https://discord.gg/zsSTcH2qhG).

### LLM Observability Integrations

### Main Integrations

| Integration                                                                                            | Supports                                                                                                                              | Description                                                                                                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [Generic Gateway](https://docs.helicone.ai/getting-started/integration-method/gateway)                 | Python, Node.js, Python w/package, LangChain JS, LangChain, cURL                                                                      | Gateway for generic integration                                                                                |
| [Async Logging (OpenLLMetry)](https://docs.helicone.ai/getting-started/integration-method/openllmetry) | JS/TS, Python                                                                                                                         | Asynchronous logging supporting OpenAI, Anthropic, Azure OpenAI, Cohere, Bedrock, Google AI Platform, and more |
| OpenAI                                                                                                 | [JS/TS](https://docs.helicone.ai/integrations/openai/javascript), [Python](https://docs.helicone.ai/integrations/openai/python)       | Integration with OpenAI                                                                                        |
| Azure OpenAI                                                                                           | [JS/TS](https://docs.helicone.ai/integrations/azure/javascript), [Python](https://docs.helicone.ai/integrations/azure/python)         | Integration with Azure OpenAI                                                                                  |
| Anthropic                                                                                              | [JS/TS](https://docs.helicone.ai/integrations/anthropic/javascript), [Python](https://docs.helicone.ai/integrations/anthropic/python) | Integration with Anthropic                                                                                     |
| Ollama                                                                                                 | [JS/TS](https://docs.helicone.ai/integrations/ollama/javascript)                                                                      | Integration with Ollama                                                                                        |
| AWS Bedrock                                                                                            | [JS/TS](https://docs.helicone.ai/integrations/bedrock/javascript)                                                                     | Integration with AWS Bedrock                                                                                   |
| Gemini API                                                                                             | [JS/TS](https://docs.helicone.ai/integrations/gemini/api/javascript)                                                                  | Integration with Gemini API                                                                                    |
| Gemini Vertex AI                                                                                       | [JS/TS](https://docs.helicone.ai/integrations/gemini/vertex/javascript)                                                               | Integration with Gemini Vertex AI                                                                              |
| Vercel AI                                                                                              | [JS/TS](https://docs.helicone.ai/integrations/vercelai/javascript)                                                                    | Integration with Vercel AI                                                                                     |
| [Anyscale](https://docs.helicone.ai/getting-started/integration-method/anyscale)                       | JS/TS, Python                                                                                                                         | Integration with Anyscale                                                                                      |
| [TogetherAI](https://docs.helicone.ai/getting-started/integration-method/together)                     | JS/TS, Python                                                                                                                         | Integration with Together                                                                                      |
| [Hyperbolic](https://docs.helicone.ai/getting-started/integration-method/hyperbolic)                   | JS/TS, Python                                                                                                                         | Integration with Hyperbolic                                                                                    |
| Groq                                                                                                   | [JS/TS](https://docs.helicone.ai/integrations/groq/javascript), [Python](https://docs.helicone.ai/integrations/groq/python)           | Integration with Groq                                                                                          |
| [DeepInfra](https://docs.helicone.ai/getting-started/integration-method/deepinfra)                     | JS/TS, Python                                                                                                                         | Integration with DeepInfra                                                                                     |
| [OpenRouter](https://docs.helicone.ai/getting-started/integration-method/openrouter)                   | JS/TS, Python                                                                                                                         | Integration with OpenRouter                                                                                    |
| [LiteLLM](https://docs.helicone.ai/getting-started/integration-method/litellm)                         | JS/TS, Python                                                                                                                         | Integration with LiteLLM                                                                                       |
| [Fireworks AI](https://docs.helicone.ai/getting-started/integration-method/fireworks)                  | JS/TS, Python                                                                                                                         | Integration with Fireworks                                                                                     |

### Supported Frameworks

| Framework                                                             | Supports      | Description                 |
| --------------------------------------------------------------------- | ------------- | --------------------------- |
| [LangChain](https://docs.helicone.ai/integrations/openai/langchain)   | JS/TS, Python | Integration with LangChain  |
| [LlamaIndex](https://docs.helicone.ai/integrations/openai/llamaindex) | Python        | Integration with LlamaIndex |
| [CrewAI](https://docs.helicone.ai/integrations/openai/crewai)         | -             | Integration with CrewAI     |

### Other Integrations

| Integration                                                                    | Description                 |
| ------------------------------------------------------------------------------ | --------------------------- |
| [PostHog](https://docs.helicone.ai/getting-started/integration-method/posthog) | Integration with PostHog    |
| [RAGAS](https://docs.helicone.ai/other-integrations/ragas)                     | Integration with RAGAS      |
| [Open WebUI](https://docs.helicone.ai/other-integrations/open-webui)           | Integration with Open WebUI |
| [MetaGPT](https://docs.helicone.ai/other-integrations/meta-gpt)                | Integration with MetaGPT    |
| [Open Devin](https://docs.helicone.ai/other-integrations/open-devin)           | Integration with Open Devin |
| [Mem0 EmbedChain](https://docs.helicone.ai/other-integrations/embedchain)      | Integration with EmbedChain |
| [Dify](https://docs.helicone.ai/other-integrations/dify)                       | Integration with Dify       |

> Don't see your provider or framework? Check out the latest integrations in our [docs](https://docs.helicone.ai/getting-started/quick-start). If not found there, request a new integration by contacting help@helicone.ai.

<!-- ## Install Wrangler and Yarn

```bash
nvm install 18.18.0
nvm use 18.18.0
npm install -g wrangler
npm install -g yarn
```

## Install [Supabase CLI](https://supabase.com/docs/guides/cli)

```bash
brew install supabase/tap/supabase
```

## Install and setup ClickHouse

```bash
# This will start clickhouse locally
python3 clickhouse/ch_hcone.py --start
```

## Install and setup MinIO

```bash
# Install minio globally
python3 -m pip install minio

# Start minio
python3 minio_hcone.py --restart

# Minio Dashboard will be available at http://localhost:9001
# Default credentials:
# Username: minioadmin
# Password: minioadmin
```

## Run all services

```bash
cd web

# start supabase to collect logs metadata
supabase start

# start frontend
yarn
yarn dev:local

# start workers for proxying requests
# in another terminal
cd worker
yarn
chmod +x run_all_workers.sh
./run_all_workers.sh

# start jawn (for serving the FE, collecting logs and handling API requests)
cd valhalla/jawn
cp .env.example .env
yarn && yarn dev

# Make your request to local host
curl --request POST \
  --url http://127.0.0.1:8787/v1/chat/completions \
  --header 'Authorization: Bearer <KEY>' \
  --data '{
	"model": "gpt-4o-mini",
	"messages": [
		{
			"role": "user",
			"content": "What is the UNIX Epoch?"
		}
	],
	"temperature": 1,
	"max_tokens": 7
}'

# Now you can go to localhost:3000 and create an account and see your request.
# When creating an account on localhost, you will automatically be signed in.
```

## Setup `.env` file

Make sure your .env file is in `web/.env`. Here is an example:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_HELICONE_BILLING_PORTAL_LINK=""
NEXT_PUBLIC_HELICONE_CONTACT_LINK="https://calendly.com/d/x5d-9q9-v7x/helicone-discovery-call"
STRIPE_PRICE_ID=""
STRIPE_STARTER_PRICE_ID=""
STRIPE_ENTERPRISE_PRODUCT_ID=""
STRIPE_STARTER_PRODUCT_ID=""
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
SUPABASE_URL="http://localhost:54321"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
NEXT_PUBLIC_HELICONE_JAWN_SERVICE="http://localhost:8585"
``` -->

# Community 🌍

## Learn this repo with Onboard AI

[learnthisrepo.com/helicone](learnthisrepo.com/helicone)

## Supported Projects

| Name                                                               | Docs                                                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [nextjs-chat-app](https://github.com/enricoros/nextjs-chatgpt-app) | [Docs](https://github.com/enricoros/nextjs-chatgpt-app/issues/32)                         |
| [langchain](https://github.com/hwchase17/langchain)                | [Docs](https://python.langchain.com/en/latest/ecosystem/helicone.html?highlight=helicone) |
| [langchainjs](https://github.com/hwchase17/langchainjs)            | [Docs](https://js.langchain.com/docs/ecosystem/helicone)                                  |
| [ModelFusion](https://modelfusion.dev)                             | [Docs](https://modelfusion.dev/integration/observability/helicone)                        |

## Contributing

We are extremely open to contributors on documentation, integrations, and feature requests.

- If you have an idea for how Helicone can be better, create a [GitHub issue](https://github.com/Helicone/helicone/issues) or vote on the [roadmap](https://github.com/Helicone/helicone/labels/roadmap)
- Join [discord](https://discord.gg/zsSTcH2qhG) to ask questions

### Update Cost Data

1. Add new cost data to the `costs/src/` directory. If provider folder exists, add to its index.ts. If not, create a new folder with the provider name and an index.ts and export a cost object

   Example:

   File name: `costs/src/anthropic/index.ts`

   ```typescript
   export const costs: ModelRow[] = [
     {
       model: {
         operator: "equals",
         value: "claude-instant-1",
       },
       cost: {
         prompt_token: 0.00000163,
         completion_token: 0.0000551,
       },
     },
   ];
   ```

   We can match in 3 ways:

   - `equals`: The model name must be exactly the same as the value
   - `startsWith`: The model name must start with the value
   - `includes`: The model name must include the value

   Use what is most appropriate for the model

   cost object is the cost per token for prompt and completion

2. Import the new cost data into `src/providers/mappings.ts` and add it to the `providers` array

   Example:

   File name: `src/providers/mappings.ts`

   ```typescript
   import { costs as anthropicCosts } from "./providers/anthropic";

   // 1. Add the pattern for the API so it is a valid gateway.
   const anthropicPattern = /^https:\/\/api\.anthropic\.com/;

   // 2. Add Anthropic pattern, provider tag, and costs array from the generated list
   export const providers: {
     pattern: RegExp;
     provider: string;
     costs?: ModelRow[];
   }[] = [
     // ...
     {
       pattern: anthropicPattern,
       provider: "ANTHROPIC",
       costs: anthropicCosts,
     },
     // ...
   ];
   ```

3. Run `yarn test -- -u` in the `cost/` directory to update the snapshot tests
4. Run `yarn copy` in the `cost/` directory to copy the cost data into other directories

# Contributors

<a href="https://github.com/Helicone/helicone/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Helicone/helicone" />
</a>

## License

Helicone is licensed under the [Apache v2.0 License](LICENSE).
