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
  HEARTBEAT_URLS_JSON: string;
}

const constructorMapping: Record<string, any> = {
  AsyncHeartBeat: new AsyncHeartBeat(),
  FeedbackHeartBeat: new FeedbackHeartBeat(),
  GraphQLHeartBeat: new GraphQLHeartBeat(),
  OpenAIProxyHeartBeat: new OpenAIProxyHeartBeat(),
  AnthropicProxyHeartBeat: new AnthropicProxyHeartBeat(),
};

interface HeartBeatItem {
  urls: string[];
  constructorName: string; // You can extend this interface to include any other properties as needed.
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const heartBeats = JSON.parse(env.HEARTBEAT_URLS_JSON) as HeartBeatItem[];

    const heartBeatPromises = heartBeats.map(async (item) => {
      const constructor = constructorMapping[item.constructorName];
      if (!constructor) {
        console.error(`Instance for ${item.constructorName} not found.`);
        return;
      }

      const status = await constructor.beat(env);

      if (status === 200) {
        const urlPromises = item.urls.map((url) => fetch(url));
        await Promise.all(urlPromises);
      }
    });

    await Promise.all(heartBeatPromises);
  },
};
