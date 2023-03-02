![Helicone Logo](https://github.com/Helicone/helicone/blob/main/web/public/assets/logos/logo-transparent.png)

# Helicone.ai

Helicone is the observability platform for GPT-3 users. Companies save on their OpenAI bills and identify application issues by monitoring their usage, latency, and costs on Helicone.

## Founders

- [@chitalian](https://www.github.com/chitalian)
- [@scottmktn](https://www.github.com/scottmktn)
- [@BarakOshri](https://www.github.com/BarakOshri)

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
# start supabase to log all the db stuff...
supabase start

# start frontend
cd web
yarn
yarn dev

# start worker (simulates oai.hconeai.com)
# in another terminal
cd worker
wrangler dev
# wait for it to load (like 10 seconds), press `L` to start in local mode
```

#### Publish

```bash
wrangler publish --env production
```
