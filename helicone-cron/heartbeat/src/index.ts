/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler publish --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

import { IHeartBeat } from "./heartbeats/IHeartBeat";
import { AnthropicProxyHeartBeat } from "./heartbeats/anthropicProxy";
import { AsyncHeartBeat } from "./heartbeats/async";
import { FeedbackHeartBeat } from "./heartbeats/feedback";
import { GraphQLHeartBeat } from "./heartbeats/graphQL";
import { OpenAIProxyHeartBeat } from "./heartbeats/oaiProxy";

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  HELICONE_API_KEY: string;
  HB_OAI_HCONEAI_COM: string;
  HB_ANTHROPIC_HCONEAI_COM: string;
  HB_API_HCONEAI_COM: string;
  HB_ASYNC_LOGGER: string;
  HB_GRAPHQL: string;
}

const heartBeats: {
  urls: string[];
  constructor: IHeartBeat;
}[] = [
  {
    urls: [
      "https://uptime.betterstack.com/api/v1/heartbeat/4yUxCvyuQVpYBa6pfR8gZKjw",
      "https://uptime.betterstack.com/api/v1/heartbeat/HvqUUnbgbwL7WgXitDEnkxXM",
    ],
    constructor: new AsyncHeartBeat(),
  },
  {
    urls: [
      "https://uptime.betterstack.com/api/v1/heartbeat/5BdXzeVoGNc9HsNUzuKnbYk1",
      "https://uptime.betterstack.com/api/v1/heartbeat/TyTqEpAvgQr7cVnoDHYM8gYZ",
    ],
    constructor: new FeedbackHeartBeat(),
  },
  {
    urls: [
      "https://uptime.betterstack.com/api/v1/heartbeat/5Hk6ZSKTiz8pwQzTDDWyKyip",
      "https://uptime.betterstack.com/api/v1/heartbeat/JvcXcqvsgZjvbhbint1X5M7U",
    ],
    constructor: new GraphQLHeartBeat(),
  },
  {
    urls: [
      "https://uptime.betterstack.com/api/v1/heartbeat/AjcLW9UgnmfCAaEk8htYZhhq",
      "https://uptime.betterstack.com/api/v1/heartbeat/68vwpUCYwEMpLzhy7Lr2KDQo",
    ],
    constructor: new OpenAIProxyHeartBeat(),
  },
  {
    urls: [
      "https://uptime.betterstack.com/api/v1/heartbeat/PbpjAnktvt8Mheoi9RhqXfmJ",
      "https://uptime.betterstack.com/api/v1/heartbeat/zZcubPLuGgvSBPXwSd8nyQxS",
    ],
    constructor: new AnthropicProxyHeartBeat(),
  },
];

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const heartBeatPromises = heartBeats.map(async (item) => {
      const status = await item.constructor.beat(env);

      if (status === 200) {
        const urlPromises = item.urls.map((url) => fetch(url));
        await Promise.all(urlPromises);
      }
    });

    await Promise.all(heartBeatPromises);
  },
};
