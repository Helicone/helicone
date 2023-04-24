![Helicone Logo](https://github.com/Helicone/helicone/blob/main/web/public/assets/logos/logo-black.png)

# Helicone.ai

[![](https://img.shields.io/badge/Visit%20Us-Helicone.ai-brightgreen)](https://helicone.ai)
[![](https://img.shields.io/badge/View%20Documentation-Docs-yellow)](https://docs.helicone.ai/)
[![](https://img.shields.io/badge/Join%20our%20community-Discord-blue)](https://discord.gg/zsSTcH2qhG)
[![Twitter](https://img.shields.io/twitter/follow/Helicone_ai?style=social)](https://twitter.com/helicone_ai)

Helicone is an open-source observability platform for GPT-3 users. Companies save on their OpenAI bills and identify application issues by monitoring their usage, latency, and costs on Helicone.

You know that LLMs are being used in more and more software companies today but what you may not realize is that compared to their traditional software, companies don’t have any way to monitor how they are working…

We are solving that problem by offering an open source observability platform that developers can implement in one line of code.

## Founders

- [@BarakOshri](https://www.github.com/BarakOshri) (formerly at Sisu and Stanford)
- [@chitalian](https://www.github.com/chitalian) (formerly at Apple, Intel, and Sisu)
- [@scottmktn](https://www.github.com/scottmktn) (formerly at Tesla, DraftKings, and Bain Capital)

## Community

Keep up to date with what we're working on by joining our [Discord](https://discord.gg/zsSTcH2qhG). We're more than happy to answer any questions you may have or to discuss the current state of the AI industry.

We use GitHub issues for tracking requests and bugs and we strive to abide by industry-standard best practices in open-source software development.

## Roadmap

- Full support for ChatGPT API
- Advanced filtering for data
- Exponential backoff
- Exports to Looker, Mixpanel, etc.
- Alerting to stay on top of costs and model downtime

## Get Started Locally

Install my-project with npm

#### Setup

```bash
nvm install 18.11.0
nvm use 18.11.0
npm install -g wrangler
npm install -g yarn
```

#### Install Supabase (https://supabase.com/docs/guides/cli)

```bash
brew install supabase/tap/supabase
```

#### Running

```bash
cd web

# start supabase to log all the db stuff...
supabase start

# start frontend
yarn
yarn dev

# start worker (simulates oai.hconeai.com)
# in another terminal
cd worker
yarn
wrangler dev
# wait for it to load (like 10 seconds), press `L` to start in local mode

# Make your request to local host
curl --request POST \
  --url http://127.0.0.1:8787/v1/chat/completions \
  --header 'Authorization: Bearer <KEY>' \
  --data '{
	"model": "gpt-3.5-turbo",
	"messages": [
		{
			"role": "system",
			"content": "Can you give me a random number?"
		}
	],
	"temperature": 1,
	"max_tokens": 7
}'

# Now you can go to localhost:3000 and create an account and see your request.
# When creating an account on localhost, you will automatically be signed in.
```

### Example .env file

Make sure your .env file is in `web/.env`

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
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
```

## Supported integrations

| Name                                                               | Docs                                                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [nextjs-chat-app](https://github.com/enricoros/nextjs-chatgpt-app) | [Docs](https://github.com/enricoros/nextjs-chatgpt-app/issues/32)                         |
| [langchain](https://github.com/hwchase17/langchain)                | [Docs](https://python.langchain.com/en/latest/ecosystem/helicone.html?highlight=helicone) |
| [langchainjs](https://github.com/hwchase17/langchainjs)            | [Docs](https://js.langchain.com/docs/ecosystem/helicone)                                  |
