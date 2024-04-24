import { CompressionTypes, Kafka } from "kafkajs";
import os from "os";
import { TemplateWithInputs } from "../../api/lib/promptHelpers";
import { Provider } from "../..";

export type Log = {
  request: {
    id: string;
    userId: string;
    promptId?: string;
    properties: Record<string, string>;
    heliconeApiKeyId: string;
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
    assets: Record<string, string>;
    heliconeTemplate: TemplateWithInputs;
  };
  response: {
    id: string;
    body: string;
    status: number;
    model: string;
    timeToFirstToken: number;
    responseCreatedAt: Date;
    delayMs: number;
    assets: Record<string, string>;
  };
  model: string;
};

export type HeliconeMeta = {
  modelOverride: string;
  omitRequestLog: boolean;
  omitResponseLog: boolean;
};

export type Message = {
  authorization: string;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

const redpanda = new Kafka({
  brokers: [
    "coev36dpu5ejhljb56q0.any.us-east-1.mpx.prd.cloud.redpanda.com:9092",
  ],
  ssl: {},
  sasl: {
    mechanism: "scram-sha-256",
    username: "jawn-prod",
    password: "",
  },
});
const producer = redpanda.producer();

const sendMessage = async (msg: string) => {
  try {
    return await producer.send({
      topic: "hello-world",
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: os.hostname(),
          value: JSON.stringify(msg),
        },
      ],
    });
  } catch (error: any) {
    console.error(`Unable to send message: ${error.message}`, error);
  }
};

const run = async () => {
  await producer.connect();
  for (let i = 0; i < 100; i++) {
    sendMessage(`message ${i}`).then((resp) => {
      console.log(`Message sent: ${JSON.stringify(resp)}`);
    });
  }
};

run().catch(console.error);

process.once("SIGINT", async () => {
  try {
    await producer.disconnect();
    console.log("Producer disconnected");
  } finally {
    process.kill(process.pid, "SIGINT");
  }
});
