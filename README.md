# Helicone

[![](https://img.shields.io/badge/Visit%20Us-Helicone.ai-brightgreen)](https://helicone.ai)
[![](https://img.shields.io/badge/View%20Documentation-Docs-yellow)](https://docs.helicone.ai/)
[![](https://img.shields.io/badge/Join%20our%20community-Discord-blue)](https://discord.gg/zsSTcH2qhG)
[![Twitter](https://img.shields.io/twitter/follow/Helicone_ai?style=social)](https://twitter.com/helicone_ai)

## Open-source observability platform for LLMs

Helicone is an open-source observability platform for Language Learning Models (LLMs). It offers the following features:

- 📝 Logs all of your requests to OpenAI in a user-friendly UI

- 💾 Caching, custom rate limits, and retries

- 📊 Track costs and latencies by users and custom properties

- 🎮 Every log is a playground: iterate on prompts and chat conversations in a UI

- 🚀 Share results and collaborate with your friends or teammates

- 🔜 (Coming soon) APIs to log feedback and evaluate results

# Quick Use ⚡️

Get your API key by signing up [here](https://helicone.ai).

```bash
export HELICONE_API_KEY=<your API key>
```

```bash
pip install helicone
```

```python
from helicone.openai_proxy import openai

response = openai.Completion.create(
	model="text-davinci-003",
	prompt="What is Helicone?",
	user="alice@bob.com",
	# Optional Helicone features:
	cache=True,
	properties={"conversation_id": 12},
	rate_limit_policy={"quota": 100, "time_window": 60, "segment": "user"}
)
```

👉 Then view your logs at [Helicone](https://www.helicone.ai).

## More resources

- [Langchain integration](https://python.langchain.com/docs/integrations/providers/helicone)
- [LangchainJS integration](https://js.langchain.com/docs/ecosystem/integrations/helicone)
- [Python package](https://github.com/Helicone/helicone/tree/main/helicone-python)
- [Node.JS support](https://docs.helicone.ai/quickstart/integrate-in-less-than-a-minute)
- [Developer docs](https://docs.helicone.ai/quickstart/integrate-in-less-than-a-minute)

# Local Setup 💻

Helicone's [cloud offering](https://www.helicone.ai) is deployed on Cloudflare and ensures the lowest latency add-on to your API requests.

To get started locally, Helicone is comprised of five services:

- Web: Frontend Platform (NextJs)
- Worker: Proxy & Async Logging (Cloudflare Workers)
- Jawn: Dedicated Server for serving Web (Express)
- Supabase: Application Database and Auth
- ClickHouse: Analytics Database

If you have any questions, contact help@helicone.ai or join [discord](https://discord.gg/zsSTcH2qhG).

## Install Wrangler and Yarn

```bash
nvm install 18.11.0
nvm use 18.11.0
npm install -g wrangler
npm install -g yarn
```

## Install [Supabase](https://supabase.com/docs/guides/cli)

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
# Install minio
python3 -m pip install minio

# Start minio
python3 minio_hcone.py --restart

# Dashboard will be available at http://localhost:9001
# Default credentials:
# Username: minioadmin
# Password: minioadmin
```

## Run all services

```bash
cd web

# start supabase to log all the db stuff...
supabase start

# start frontend
yarn
yarn dev

# start workers (for proxying, async logging and some API requests)
# in another terminal
cd worker
yarn
chmod +x run_all_workers.sh
./run_all_workers.sh

# start jawn (for serving the FE and handling API requests)
# in another terminal
cd valhalla/jawn
yarn && yarn dev

# Make your request to local host
curl --request POST \
  --url http://127.0.0.1:8787/v1/chat/completions \
  --header 'Authorization: Bearer <KEY>' \
  --data '{
	"model": "gpt-3.5-turbo",
	"messages": [
		{
			"role": "user",
			"content": "Can you give me a random number?"
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

## License

Helicone is licensed under the [MIT License](LICENSE).
