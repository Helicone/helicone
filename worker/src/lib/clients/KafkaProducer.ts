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
    timeToFirstToken?: number;
    responseCreatedAt: Date;
    delayMs: number;
  };
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
  private kafka: Kafka | null = null;

  constructor(env: Env) {
    if (
      !env.UPSTASH_KAFKA_URL ||
      !env.UPSTASH_KAFKA_USERNAME ||
      !env.UPSTASH_KAFKA_PASSWORD
    ) {
      console.log(
        "Required Kafka environment variables are not set, KafkaProducer will not be initialized."
      );
      return;
    }
    this.kafka = new Kafka({
      url: env.UPSTASH_KAFKA_URL,
      username: env.UPSTASH_KAFKA_USERNAME,
      password: env.UPSTASH_KAFKA_PASSWORD,
    });
  }

  async sendMessage(msg: KafkaMessage) {
    if (!this.kafka) {
      console.log("KafkaProducer is not initialized, skipping sendMessage");
      return;
    }

    const p = this.kafka.producer();

    let attempts = 0;
    const maxAttempts = 3;
    const timeout = 1000;

    while (attempts < maxAttempts) {
      try {
        const message = JSON.stringify({
          value: JSON.stringify(msg),
        });

        const res = await p.produce("request-response-logs-prod", message, {
          key: msg.log.request.id,
        });
        console.log(`Produced message, response: ${JSON.stringify(res)}`);
        return res;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.log(`Attempt ${attempts + 1} failed: ${error.message}`);
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, timeout));
        } else {
          throw error;
        }
      }
    }
  }
}
