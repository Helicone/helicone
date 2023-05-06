# Running locally

```
cp .env.example .env
docker compose up
```

Default URLs:

- Helicone Webpage: localhost:3000
- Helicone Worker: localhost:8787

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
