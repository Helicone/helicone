import { AnthropicProxyHeartBeat } from "./heartbeats/anthropicProxy";
import { AsyncHeartBeat } from "./heartbeats/async";
import { FeedbackHeartBeat } from "./heartbeats/feedback";
import { GraphQLHeartBeat } from "./heartbeats/graphQL";
import { OpenAIProxyHeartBeat } from "./heartbeats/oaiProxy";
import { UsageManager } from "./managers/UsageManager";
import { PgWrapper } from "./db/PgWrapper";
import { alertSqsCongestion } from "./heartbeats/alertSqsCongestion";
import { AlertManager } from "./managers/AlertManager";

export interface Env {
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  HELICONE_API_KEY: string;
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
  HYPERDRIVE: Hyperdrive;
  SLACK_WEBHOOK_URL: string;
  SENTRY_API_KEY: string;
  SENTRY_PROJECT_ID: string;
  VALHALLA_URL: string;
  HELICONE_MANUAL_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  REQUEST_LOGS_QUEUE_URL: string;
  REQUEST_LOGS_QUEUE_URL_LOW_PRIORITY: string;
  SLACK_ALERT_CHANNEL: string;
  US_API_HEARTBEAT_URL: string;
  EU_API_HEARTBEAT_URL: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    if (controller.cron === "* * * * *") {
      const apiHeartbeat = await fetch("https://api.helicone.ai/healthcheck");
      if (apiHeartbeat.ok) {
        console.log(env.US_API_HEARTBEAT_URL);
        await fetch(env.US_API_HEARTBEAT_URL);
      }
      const euApiHeartbeat = await fetch(
        "https://eu.api.helicone.ai/healthcheck"
      );
      if (euApiHeartbeat.ok) {
        console.log(env.EU_API_HEARTBEAT_URL);
        await fetch(env.EU_API_HEARTBEAT_URL);
      }
      await alertSqsCongestion(env, new AlertManager(env));
    } else if (controller.cron === "0 * * * *") {
      console.log("hourly cron");
    }
  },
};
