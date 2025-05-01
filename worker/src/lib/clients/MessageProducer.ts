import { Env, Provider } from "../..";
import { Kafka } from "@upstash/kafka";
import { err } from "../util/results";
import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

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
    isScore?: boolean;
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

export type MessageData = {
  id: string;
  authorization: string;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

// Define a common interface
export interface MessageProducer {
  sendMessage(msg: MessageData): Promise<any>;
}

// Implementation for Kafka
export class KafkaProducerImpl implements MessageProducer {
  private kafka: Kafka | null = null;
  private VALHALLA_URL: string | undefined = undefined;
  private HELICONE_MANUAL_ACCESS_KEY: string | undefined = undefined;

  constructor(env: Env) {
    // Current Kafka initialization
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

  async sendMessage(msg: MessageData) {
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

  async sendMessageHttp(msg: MessageData) {
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
    } catch (error: any) {
      console.error(`Failed to send message via REST: ${error.message}`);
    }
  }
}

// Implementation for SQS
export class SQSProducerImpl implements MessageProducer {
  private sqs: SQSClient;
  private queueUrls: Record<string, string>;
  private VALHALLA_URL: string | undefined = undefined;
  private HELICONE_MANUAL_ACCESS_KEY: string | undefined = undefined;

  constructor(env: Env) {
    this.VALHALLA_URL = env.VALHALLA_URL;
    this.HELICONE_MANUAL_ACCESS_KEY = env.HELICONE_MANUAL_ACCESS_KEY;

    this.sqs = new SQSClient({
      region: env.AWS_REGION || "us-west-2",
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    this.queueUrls = {
      "request-response-logs-prod": env.REQUEST_LOGS_QUEUE_URL || "",
      "helicone-scores-prod": env.HELICONE_SCORES_QUEUE_URL || "",
    };
  }

  async sendMessage(msg: MessageData) {
    // Check if we need to use the HTTP fallback
    if (
      msg.heliconeMeta.heliconeManualAccessKey ===
      this.HELICONE_MANUAL_ACCESS_KEY
    ) {
      return this.sendMessageHttp(msg);
    }

    // Determine the proper queue based on message type
    const topic = msg.log.request.isScore
      ? "helicone-scores-prod"
      : "request-response-logs-prod";
    const queueUrl = this.queueUrls[topic];

    if (!queueUrl) {
      console.error(`No queue URL found for topic: ${topic}`);
      return this.sendMessageHttp(msg);
    }

    let attempts = 0;
    const maxAttempts = 3;
    const timeout = 1000;

    while (attempts < maxAttempts) {
      try {
        const command = new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(msg),
          // We don't need deduplication IDs since we handle on consumer side
        });

        const response = await this.sqs.send(command);
        console.log(
          `Message sent to SQS, response: ${JSON.stringify(response)}`
        );
        return response;
      } catch (error: any) {
        console.log(`SQS attempt ${attempts + 1} failed: ${error.message}`);
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, timeout));
        } else {
          // Fall back to HTTP if all SQS attempts fail
          return this.sendMessageHttp(msg);
        }
      }
    }
  }

  // Reuse the same HTTP fallback method
  async sendMessageHttp(msg: MessageData) {
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
    } catch (error: any) {
      console.error(`Failed to send message via REST: ${error.message}`);
    }
  }
}

// Dual-Write Capability for migration phase
export class DualWriteProducer implements MessageProducer {
  private primary: MessageProducer;
  private secondary: MessageProducer;

  constructor(
    primaryProducer: MessageProducer,
    secondaryProducer: MessageProducer
  ) {
    this.primary = primaryProducer;
    this.secondary = secondaryProducer;
  }

  async sendMessage(msg: MessageData) {
    // Send to primary and log any errors but don't fail
    try {
      await this.primary.sendMessage(msg);
    } catch (error: any) {
      console.error(`Error sending to primary queue: ${error.message}`);
    }

    // Always return the result from the secondary
    return this.secondary.sendMessage(msg);
  }
}

// Factory to create the appropriate producer
export class MessageProducerFactory {
  static createProducer(env: Env): MessageProducer {
    if (env.QUEUE_PROVIDER === "sqs") {
      return new SQSProducerImpl(env);
    } else if (env.QUEUE_PROVIDER === "dual") {
      const kafkaProducer = new KafkaProducerImpl(env);
      const sqsProducer = new SQSProducerImpl(env);
      return new DualWriteProducer(kafkaProducer, sqsProducer);
    } else {
      return new KafkaProducerImpl(env);
    }
  }
}

// Main wrapper class
export class HeliconeProducer {
  private producer: MessageProducer;

  constructor(env: Env) {
    this.producer = MessageProducerFactory.createProducer(env);
  }

  async sendMessage(msg: MessageData) {
    return this.producer.sendMessage(msg);
  }
}
