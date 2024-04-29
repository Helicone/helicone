import { TemplateWithInputs } from "../../api/lib/promptHelpers";
import { Env, Provider } from "../..";

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
    model: string;
    path: string;
    body: string;
    threat?: boolean;
    countryCode?: string;
    requestCreatedAt: Date;
    isStream: boolean;
    heliconeTemplate?: TemplateWithInputs;
  };
  response: {
    id: string;
    body: string;
    status: number;
    model: string;
    timeToFirstToken?: number;
    responseCreatedAt: Date;
    delayMs: number;
  };
  assets: Map<string, string>;
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
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async sendMessage(msg: KafkaMessage) {
    let attempts = 0;
    const maxAttempts = 3;
    const timeout = 1000; // Time in milliseconds between retries

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(
          `https://native-koala-11924-us1-rest-kafka.upstash.io/produce/logs`,
          {
            body: JSON.stringify(msg),
            headers: {
              Authorization: `Basic ${this.env.UPSTASH_KAFKA_API_KEY}`,
            },
          }
        );
        const data = await response.json();
        console.log(data);
        return data; // Exit function after a successful fetch
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
