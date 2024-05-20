import { TemplateWithInputs } from "../../api/lib/promptHelpers";
import { Env, Provider } from "../..";
import { Kafka, Producer } from "@upstash/kafka";
import { err } from "../util/results";
import {
  AESEncryptionManager,
  newAESEncryptionManager,
} from "./encryptionManager";

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

export type DecryptedPayload = {
  authorization: string;
  posthogApiKey?: string;
};
export type KafkaMessage = {
  id: string;
  decryptedPayload: DecryptedPayload;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

export type EncryptedKafkaMessage = Omit<KafkaMessage, "decryptedPayload"> & {
  encryptedPayload: string;
};

async function encryptKafkaMessage(
  msg: KafkaMessage,
  encryptionManager: AESEncryptionManager
): Promise<EncryptedKafkaMessage> {
  const encryptedPayload = await encryptionManager.encrypt(
    JSON.stringify(msg.decryptedPayload)
  );
  return {
    ...msg,
    encryptedPayload,
  };
}

export class KafkaProducer {
  private kafka: Kafka | null = null;
  private VALHALLA_URL: string | undefined = undefined;

  encryptionManagerKey: string;

  private _encryptionManager: AESEncryptionManager | null = null;

  constructor(env: Env) {
    this.VALHALLA_URL = env.VALHALLA_URL;
    this.encryptionManagerKey = env.JAWN_AES_KEY;

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

  async getEncryptionManager() {
    if (this._encryptionManager) {
      return this._encryptionManager;
    }
    this._encryptionManager = await newAESEncryptionManager(
      this.encryptionManagerKey
    );
    return this._encryptionManager;
  }

  private async sendEncryptedMessage(msg: EncryptedKafkaMessage) {
    if (!this.kafka) {
      throw new Error("Kafka is not initialized");
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const p = this.kafka.producer();
    const message = JSON.stringify({
      value: JSON.stringify(msg),
    });

    return await p.produce("request-response-logs-prod", message, {
      key: msg.log.request.id,
    });
  }

  async sendMessage(msg: KafkaMessage) {
    if (!this.kafka) {
      await this.sendMessageHttp(msg);
      return;
    }

    let attempts = 0;
    const maxAttempts = 3;
    const timeout = 1000;

    while (attempts < maxAttempts) {
      try {
        const encryptedKafkaMessage = await encryptKafkaMessage(
          msg,
          await this.getEncryptionManager()
        );

        const res = await this.sendEncryptedMessage(encryptedKafkaMessage);
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
          Authorization: `${msg.decryptedPayload.authorization}`,
        },
        body: JSON.stringify({
          log: msg.log,
          authorization: msg.decryptedPayload.authorization,
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
