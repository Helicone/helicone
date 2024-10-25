import { Env, Provider } from "../..";
import { Kafka } from "@upstash/kafka";
import { err } from "../util/results";
import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";

export type Log = {
  request: {
    id: string;
    userId: string;
    promptId?: string;
    promptVersion?: string;
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
    experimentColumnId?: string;
    experimentRowIndex?: string;
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
  webhookEnabled: boolean;
  posthogApiKey?: string;
  posthogHost?: string;
  lytixKey?: string;
  lytixHost?: string;
  heliconeManualAccessKey?: string;
};

export type KafkaMessage = {
  id: string;
  authorization: string;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

export class KafkaProducer {
  private kafka: Kafka | null = null;
  private VALHALLA_URL: string | undefined = undefined;
  private HELICONE_MANUAL_ACCESS_KEY: string | undefined = undefined;

  constructor(env: Env) {
    this.VALHALLA_URL = env.VALHALLA_URL;
    this.HELICONE_MANUAL_ACCESS_KEY = env.HELICONE_MANUAL_ACCESS_KEY;

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
    console.log("their's", msg.heliconeMeta.heliconeManualAccessKey);
    console.log("mine", this.HELICONE_MANUAL_ACCESS_KEY);
    if (
      !this.kafka ||
      msg.heliconeMeta.heliconeManualAccessKey ===
        this.HELICONE_MANUAL_ACCESS_KEY
    ) {
      await this.sendMessageHttp(msg);
      return;
    }

    const producer = this.kafka.producer();

    let attempts = 0;
    const maxAttempts = 3;
    const timeout = 1000;

    while (attempts < maxAttempts) {
      try {
        const message = JSON.stringify({
          value: JSON.stringify(msg),
        });

        const res = await producer.produce(
          "request-response-logs-prod",
          message,
          {
            key: msg.log.request.id,
          }
        );
        console.log(`Produced message, response: ${JSON.stringify(res)}`);
        return res;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.log(`Attempt ${attempts + 1} failed: ${error.message}`);
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, timeout));
        } else {
          return err(`Failed to produce message: ${error.message}`);
        }
      }
    }
  }

  async sendMessageHttp(msg: KafkaMessage) {
    try {
      const result = await fetch(`${this.VALHALLA_URL}/v1/log/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${msg.authorization}`,
        },
        body: JSON.stringify({
          log: msg.log,
          authorization: msg.authorization,
          heliconeMeta: msg.heliconeMeta,
        }),
      });

      if (result.status !== 200) {
        console.error(`Failed to send message via REST: ${result.statusText}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`Failed to send message via REST: ${error.message}`);
    }
  }
}
