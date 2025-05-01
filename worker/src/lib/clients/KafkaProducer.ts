import { Env, Provider } from "../..";
import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { MessageData, HeliconeProducer } from "./MessageProducer";

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

export type KafkaMessage = MessageData;

export class HeliconeProducerLegacyWrapper {
  private producer: HeliconeProducer;

  constructor(env: Env) {
    this.producer = new HeliconeProducer(env);
  }

  async sendMessage(msg: KafkaMessage) {
    return this.producer.sendMessage(msg);
  }

  async sendMessageHttp(msg: KafkaMessage) {
    // This method is kept for backwards compatibility
    return this.sendMessage(msg);
  }
}
