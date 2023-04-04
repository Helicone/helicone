# Local Development

## Initial requirements
You need to have installed Supabase (https://supabase.com/docs/guides/cli)

You need to create the .env file that docker-compose will use.
It must have the following environment variables:
    - DATABASE_URL
    - SUPABASE_URL
    - SUPABASE_ANON_KEY
    - SUPABASE_SERVICE_ROLE_KEY


NOTE: You must change all instances of "localhost" to "host.docker.internal" for the docker container to communicate with ports on your host system.


## Getting Started
First, create all helicone images
```bash
make images
```

Then, run the local supabase development stack:

```bash
supabase start
```

This will initialize the database for your local environment. After completion, the terminal will provide the necessary environment variables above:
![Supabase Output Example](https://github.com/Helicone/helicone/blob/main/web/public/assets/supabase-example.png)

If you would like to hook into your own databasem, please checkout the [Supabase documentation](https://supabase.com/docs/guides/self-hosting/docker#using-an-external-database)


Finally, fill in the .env file in this directory.


## Running
```bash
docker-compose --env-file=.env up
```

The frontend will be open on http://localhost:3001
The worker (simulating oai.hconeai.com) will be available on http://localhost:8787