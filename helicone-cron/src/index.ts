import { createClient } from "@supabase/supabase-js";
import { StripeClient } from "./client/StripeClient";
import { ClickhouseWrapper } from "./db/ClickhouseWrapper";
import { OrganizationStore } from "./db/OrganizationStore";
import { RequestResponseStore } from "./db/RequestResponseStore";
import { AnthropicProxyHeartBeat } from "./heartbeats/anthropicProxy";
import { AsyncHeartBeat } from "./heartbeats/async";
import { FeedbackHeartBeat } from "./heartbeats/feedback";
import { GraphQLHeartBeat } from "./heartbeats/graphQL";
import { OpenAIProxyHeartBeat } from "./heartbeats/oaiProxy";
import { UsageManager } from "./managers/UsageManager";
import { PgWrapper } from "./db/PgWrapper";

export interface Env {
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  HELICONE_API_KEY: string;
  HB_OAI_HCONEAI_COM: string;
  HB_ANTHROPIC_HCONEAI_COM: string;
  HB_API_HCONEAI_COM: string;
  HB_ASYNC_LOGGER: string;
  HB_GRAPHQL: string;
  HEARTBEAT_URLS_JSON: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  STRIPE_API_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_DATEBASE_URL: string;
  SUPABASE_DATABASE_SSL: string;
  ENVIRONMENT: string;
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
    if (controller.cron === "* * * * *") {
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
    } else if (controller.cron === "0 * * * *") {
      const clickhouseWrapper = new ClickhouseWrapper({
        CLICKHOUSE_HOST: env.CLICKHOUSE_HOST,
        CLICKHOUSE_USER: env.CLICKHOUSE_USER,
        CLICKHOUSE_PASSWORD: env.CLICKHOUSE_PASSWORD,
      });

      const supabaseClient = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      );

      const usageManager = new UsageManager(
        new OrganizationStore(
          clickhouseWrapper,
          supabaseClient,
          new PgWrapper(
            env.SUPABASE_DATEBASE_URL,
            env.SUPABASE_DATABASE_SSL,
            env.ENVIRONMENT
          )
        ),
        new RequestResponseStore(clickhouseWrapper, supabaseClient),
        new StripeClient(env.STRIPE_API_KEY)
      );

      const result = await usageManager.chargeOrgUsage();

      if (result.error) {
        console.error("Error calculating usage", result.error);
      }
    }
  },
};
