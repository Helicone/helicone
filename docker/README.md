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
docker build --platform linux/amd64 -t helicone/supabase-migration-runner -f dockerfiles/dockerfile_migration_runner .
docker build -t helicone/worker -f dockerfiles/dockerfile_worker .
docker build -t helicone/web -f dockerfiles/dockerfile_web .
docker build -t helicone/clickhouse-migration-runner -f dockerfiles/dockerfile_clickhouse_migration_runner . --no-cache
```

### Background

This folder is forked from [supabase](https://github.com/supabase/supabase/tree/master/docker)'s docker

Here is a helpful guide for getting started: [here](https://supabase.com/docs/guides/hosting/docker)

### DinD

```sh

docker stop helicone-dind
docker rm helicone-dind
docker build -t helicone-dind -f dockerfile-dind .
docker run -d --privileged --name helicone-dind -p 3000:3000 -p 54321:54321 -p 54323:54323 -p 8787:8787 -p 8585:8585 helicone-dind
# NOTE YOU MUST SLEEP OR WAIT FOR DIND SERVICE TO START
docker exec -it helicone-dind docker compose up
```
