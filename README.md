## Getting started locally

## Setup

```bash
nvm install 18.11.0
nvm use 18.11.0
npm install -g wrangler
npm install -g yarn
```

Install supabase https://supabase.com/docs/guides/cli

```
brew install supabase/tap/supabase
```

## Running

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

### Publish

```
wrangler publish --env production
```
