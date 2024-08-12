<p align="center">
  <img alt="heliconelogo" src="https://github.com/user-attachments/assets/895f1a0d-6eea-4b5c-81fa-10cab5855812" width="400">
</p>
<div align="center">
  <table>
    <tr>
      <td align="center"><strong>🔍 Observability</strong></td>
      <td align="center"><strong>🕸️ Agent Tracing</strong></td>
      <td align="center"><strong>💬 Prompt Management</strong></td>
    </tr>
    <tr>
      <td align="center"><strong>📊 Evaluations</strong></td>
      <td align="center"><strong>📚 Datasets</strong></td>
      <td align="center"><strong>🎛️ Fine-tuning</strong></td>
    </tr>
  </table>
</div>
<p align="center">
  <a href="https://docs.helicone.ai/">Docs</a> • <a href="https://discord.gg/zsSTcH2qhG">Discord</a> • <a href="https://us.helicone.ai/roadmap">Roadmap</a> • <a href="https://www.helicone.ai/changelog">Changelog</a> • <a href="https://github.com/helicone/helicone/issues">Bug reports</a>
</p>
<p align="center">
<img src="https://github.com/user-attachments/assets/e16332e9-d642-427e-b3ce-1a74a17f7b2c" alt="Open Source" width="800">
</a>
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

## Helicone is the all-in-one, open-source LLM developer platform to build better LLM applications

- 🔌 **Integrate**: One-line of code to log all your requests to [OpenAI](https://docs.helicone.ai/integrations/openai/javascript), [Anthropic](https://docs.helicone.ai/integrations/anthropic/javascript), [LangChain](https://docs.helicone.ai/integrations/openai/langchain), [Gemini](https://docs.helicone.ai/integrations/gemini/api/javascript), [TogetherAI](https://docs.helicone.ai/getting-started/integration-method/together), [LlamaIndex](https://docs.helicone.ai/integrations/openai/llamaindex), [LiteLLM](https://docs.helicone.ai/getting-started/integration-method/litellm), [OpenRouter](https://docs.helicone.ai/getting-started/integration-method/openrouter), and [more](https://docs.helicone.ai/getting-started/quick-start)
- 📊 **Observe**: Inspect and debug traces & [sessions](https://docs.helicone.ai/features/sessions) for agents, chatbots, document processing pipelines, and more
- 📈 **Analyze**: Track metrics like [cost](https://docs.helicone.ai/faq/how-we-calculate-cost#developer), latency, quality, and more. Export to [PostHog](https://docs.helicone.ai/getting-started/integration-method/posthog) in one-line for custom dashboards
- 🎮 **Playground**: Rapidly test and iterate on prompts, sessions and traces in our UI
- 🧠 **Prompt Management**: [Version and experiment with prompts](https://docs.helicone.ai/features/prompts) using production data. Your prompts remain under your control, always accessible.
- 🔍 **Evaluate**: Automatically run evals on traces or sessions using the latest platforms: [LastMile](https://lastmileai.dev/) or [Ragas](https://ragas.io/) (more coming soon)
- 🎛️ **Fine-tune**: Fine-tune with one of our fine-tuning partners: [OpenPipe](https://openpipe.ai/) or [Autonomi](https://www.autonomi.ai/) (more coming soon)
- 🛜 **Gateway**: [Caching](https://docs.helicone.ai/features/advanced-usage/caching), [custom rate limits](https://docs.helicone.ai/features/advanced-usage/custom-rate-limits), [LLM security](https://docs.helicone.ai/features/advanced-usage/llm-security), and more with our gateway
- 🛡️ **Enterprise Ready**: SOC 2 and GDPR compliant

# Quick Start ⚡️ Just add a Header

Get your API key by signing up [here](https://helicone.ai).

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});
```

👉 Then view your logs at [Helicone](https://www.helicone.ai).

## Resources

- [Langchain integration](https://python.langchain.com/docs/integrations/providers/helicone)
- [LangchainJS integration](https://js.langchain.com/docs/ecosystem/integrations/helicone)
- [Python package](https://github.com/Helicone/helicone/tree/main/helicone-python)
- [Node.JS support](https://docs.helicone.ai/quickstart/integrate-in-less-than-a-minute)
- [Developer docs](https://docs.helicone.ai/quickstart/integrate-in-less-than-a-minute)

# Local Setup 💻

Helicone's [cloud offering](https://www.helicone.ai) is deployed on Cloudflare and ensures the lowest latency add-on to your API requests.

To get started locally, Helicone is comprised of five services:

- Web: Frontend Platform (NextJS)
- Worker: Proxy Logging (Cloudflare Workers)
- Jawn: Dedicated Server for serving collecting logs (Express + Tsoa)
- Supabase: Application Database and Auth
- ClickHouse: Analytics Database
- Minio: Object Storage for logs.

If you have any questions, contact help@helicone.ai or join [discord](https://discord.gg/zsSTcH2qhG).

## Install Wrangler and Yarn

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
```

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
