# Template: worker-helicone-scores

[![Deploy with Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/workers-sdk/tree/main/templates/worker-helicone-scores)

This template demonstrates using the [`Helicone Scores`](https://docs.helicone.ai/features/scores) to score your request

## Setup

You'll need to use wrangler secrets to add appropriate value for `HELICONE_AUTH`.

```sh
$ wrangler secret put HELICONE_AUTH
```

To create a `my-project` directory using this template, run:

```sh
$ npx wrangler generate my-project worker-helicone-scores
# or
$ yarn wrangler generate my-project worker-helicone-scores
# or
$ pnpm wrangler generate my-project worker-helicone-scores
```

## Deploy

Once you are ready, you can publish your code by running the following command:

```sh
$ wrangler deploy
```
