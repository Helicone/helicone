![Helicone Logo](https://github.com/Helicone/helicone/blob/main/web/public/assets/logos/logo-black.png)

# Helicone.ai

![Twitter Follow (https://img.shields.io/twitter/follow/Helicone_ai?style=social)](https://twitter.com/helicone_ai)

Helicone is the observability platform for GPT-3 users. Companies save on their OpenAI bills and identify application issues by monitoring their usage, latency, and costs on Helicone.

You know that LLMs are being used in more and more software companies today but what you may not realize is that compared to their traditional software, companies don’t have any way to monitor how they are working.

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
