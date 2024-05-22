# Template: worker-helicone-scores

[![Deploy with Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Helicone/helicone/tree/main/examples/worker-helicone-scores)

This template demonstrates using the [`Helicone Scores`](https://docs.helicone.ai/features/scores) to score your request

## Setup

You'll need to use wrangler secrets to add appropriate value for `HELICONE_AUTH`.

```sh
$ wrangler secret put HELICONE_AUTH
```

## Deploy

Once you are ready, you can publish your code by running the following command:

```sh
$ wrangler deploy
```
