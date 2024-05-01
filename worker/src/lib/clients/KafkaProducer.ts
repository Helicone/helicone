import { TemplateWithInputs } from "../../api/lib/promptHelpers";
import { Env, Provider } from "../..";
import { Kafka } from "@upstash/kafka";

export type Log = {
  request: {
    id: string;
    userId: string;
    promptId?: string;
    properties: Record<string, string>;
    heliconeApiKeyId?: number;
    heliconeProxyKeyId?: string;
    targetUrl: string;
    provider: Provider;
    bodySize: number;
    model: string;
    path: string;
    threat?: boolean;
    countryCode?: string;
    requestCreatedAt: Date;
    isStream: boolean;
    heliconeTemplate?: TemplateWithInputs;
  };
  response: {
    id: string;
    status: number;
    bodySize: number;
    model: string;
    timeToFirstToken?: number;
    responseCreatedAt: Date;
    delayMs: number;
  };
  assets?: Record<string, string>;
  model: string;
};

export type HeliconeMeta = {
  modelOverride?: string;
  omitRequestLog: boolean;
  omitResponseLog: boolean;
};

export type KafkaMessage = {
  id: string;
  authorization: string;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

export class KafkaProducer {
  private kafka: Kafka;

  constructor(env: Env) {
    this.kafka = new Kafka({
      url: env.UPSTASH_KAFKA_URL,
      username: env.UPSTASH_KAFKA_USERNAME,
      password: env.UPSTASH_KAFKA_PASSWORD,
    });
  }

  async sendMessage(msg: KafkaMessage) {
    const p = this.kafka.producer();

    let attempts = 0;
    const maxAttempts = 1;
    const timeout = 1000; // Time in milliseconds between retries
    while (attempts < maxAttempts) {
      try {
        const message = JSON.stringify({
          value: JSON.stringify(msg),
        });

        const res = await p.produce("logs", message, {
          key: msg.log.request.id,
        });

        console.log(JSON.stringify(res));
        return res; // Exit function after a successful fetch
      } catch (error: any) {
        console.log(`Attempt ${attempts + 1} failed: ${error.message}`);
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, timeout));
        } else {
          throw error; // Rethrow the last error after all attempts fail
        }
      }
    }
  }
}
