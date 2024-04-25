import { CompressionTypes, Kafka, KafkaConfig } from "kafkajs";
import os from "os";
import { TemplateWithInputs } from "../../api/lib/promptHelpers";
import { Provider } from "../..";

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
  private kafka: Kafka;

  constructor(kafkaConfig: KafkaConfig) {
    this.kafka = new Kafka(kafkaConfig);
  }

  async sendMessage(msg: KafkaMessage) {
    const producer = this.kafka.producer();
    try {
      await producer.connect();
      return await producer.send({
        topic: "request-response-log-prod",
        compression: CompressionTypes.GZIP,
        messages: [
          {
            key: msg.id,
            value: JSON.stringify(msg),
          },
        ],
      });
    } catch (error: any) {
      console.error(
        `Failed to send message for message id ${msg.id}: ${error.message}`,
        error
      );
    } finally {
      await producer.disconnect();
    }
  }
}
