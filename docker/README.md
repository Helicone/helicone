# Running locally

```
cp .env.example .env
docker compose up
```

NOTE: To create a user go to http://localhost:54323/project/default/auth/users and add your account.
You can use this account to sign into Helicone at localhost:3000 via your browser.

Default URLs:

- Helicone Webpage: localhost:3000
- Helicone OpenAI Proxy: localhost:8787
- Helicone API: localhost:8788
- Helicone GATEWAY: localhost:8790

# Maintenance

### Helicone container builds

```
docker build --platform linux/amd64 -t helicone/supabase-migration-runner -f dockerfiles/dockerfile_supabase_migration_runner ../supabase
docker build -t helicone/worker -f dockerfiles/dockerfile_worker ../worker
docker build -t helicone/web -f dockerfiles/dockerfile_web ../web
docker build -t helicone/clickhouse-migration-runner -f dockerfiles/dockerfile_clickhouse_migration_runner ../clickhouse --no-cache
```

Note: we are in the process of updating our `docker-compose.yml` file.
If you are looking to self-host, we also provide an up-to-date Helm
Chart. Please reach out to us if you would like access!


# Running for development

This guide will lead you through running the infrastructure components
of Helicone locally via `docker compose`, and the services locally
bare-metal, so that you can have a fast and easy local development feedback loop.

```
git clone git@github.com:Helicone/helicone.git
cd helicone
```

## Step 1 - Install all the things

Requirements:
- [Docker](https://docs.docker.com/engine/install/)
- [Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)

Install Node version and NPM packages:

```
nvm install 20
nvm use 20
npm install -g yarn
yarn global add wrangler
```

## Step 2 - Configure all the things

From the root of the repo,

```
cp .env.example .env
cp valhalla/jawn/.env.example valhalla/jawn/.env
```

Start up Supabase: `supabase start`

Then update the values in the `.env` files based off
your API keys, including the Supabase Anon and Secret
Key that were printed after running `supabase start`.

## Step 3 - Start all the things

### Infra

Start the infrastructure components via docker compose:

```
cd docker
docker compose -f docker-compose-local.yml up -d
```

### Workers

```
cd worker
yarn
# Start OpenAI Proxy Worker
# WORKER_TYPEs: [OPENAI_PROXY, ANTHROPIC_PROXY, HELICONE_API]
# For most development, simply running only the OpenAI worker is okay
npx wrangler dev --local --var WORKER_TYPE:OPENAI_PROXY --port 8787 --test-scheduled
```

### Jawn

In a new terminal, from the root of the repo:

```
cd valhalla/jawn
yarn && yarn dev
```

### Web

In a new terminal, from the root of the repo:

```
cd web
yarn && yarn dev:local
```

## Step 4 - Verification

You can login to Helicone at `http://localhost:3000`
with the following credentials:

User: `test@helicone.ai`
Password: `password`

Change the Org to `Organization for Test` and then you should be able to see your requests!

Please do not hesitate to reach out on discord if you have any questions.

Feel free to run some of the examples from `helicone/examples` against
your new local Helicone instance!


Alternatively, you can also test the API against your local via the following
`curl` command:

```
export OPENAI_API_KEY="sk-..."
export HELICONE_API_KEY="sk-..."
curl --request POST \
  --url http://localhost:8787/v1/chat/completions \
  --header "Authorization: Bearer $OPENAI_API_KEY" \
  --header "Helicone-Auth: Bearer $HELICONE_API_KEY" \
  --header 'Content-Type: application/json' \
  --header 'Accept-Encoding: identity' \
  --header 'helicone-property-hello: world' \
  --data '{
    "model": "gpt-4o-mini",
    "messages": [
        {
            "role": "system",
            "content": "generate a prompt for stable diffusion using this article.\n The prompt should instruct the image generation model to generate a image that would be suitable for the main image of the article.\n Therefore, the image should be relevant to the article, while being photorealistic, and safe for work.\n Only include the prompt, and do not include a introduction to the prompt. The entire prompt should be 90 characters or less. Make it as relevant to the image as possible, but do not include people or faces in the prompt."
        }
    ]
}'
```

## Notes

- If you update the migration files, then do not forget to rebuild the 
  `clickhouse-migration-runner-local` Docker image!
- Currently there are some stability issues with the local Kafka and worker
  configurations, hence the `unstable` profile for those services. It's
  recommended to keep it disabled for now, until the stability issues are
  resolved.