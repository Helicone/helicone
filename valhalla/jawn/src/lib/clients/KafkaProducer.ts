import { Kafka } from "@upstash/kafka";
import { Message } from "../handlers/HandlerContext";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { LogManager } from "../../managers/LogManager";

const KAFKA_CREDS = JSON.parse(process.env.KAFKA_CREDS ?? "{}");
const KAFKA_ENABLED = (KAFKA_CREDS?.KAFKA_ENABLED ?? "false") === "true";
const KAFKA_URL = KAFKA_CREDS?.UPSTASH_KAFKA_URL;
const KAFKA_USERNAME = KAFKA_CREDS?.UPSTASH_KAFKA_USERNAME;
const KAFKA_PASSWORD = KAFKA_CREDS?.UPSTASH_KAFKA_PASSWORD;

export type Topics =
  | "request-response-logs-prod-dlq"
  | "request-response-logs-prod";

export class KafkaProducer {
  private kafka: Kafka | null = null;

  constructor() {
    if (!KAFKA_ENABLED || !KAFKA_URL || !KAFKA_USERNAME || !KAFKA_PASSWORD) {
      console.log(
        "Required Kafka environment variables are not set, KafkaProducer will not be initialized."
      );
      return;
    }

    this.kafka = new Kafka({
      url: KAFKA_URL,
      username: KAFKA_USERNAME,
      password: KAFKA_PASSWORD,
    });
  }

  async sendMessages(
    msgs: Message[],
    topic: Topics
  ): PromiseGenericResult<string> {
    if (!this.kafka) {
      return ok("Kafka is not initialized");
    }

    const p = this.kafka.producer();

    let attempts = 0;
    const maxAttempts = 3;
    const timeout = 1000;

    while (attempts < maxAttempts) {
      try {
        let data = msgs.map((msg) => {
          return {
            value: JSON.stringify({ value: JSON.stringify(msg) }),
            topic: topic,
            key: msg.log.request.id,
          };
        });

        const res = await p.produceMany(data);

        console.log(`Produced ${msgs.length} messages to ${topic}`);
        return ok(`Produced ${res.length} messages`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.log(`Attempt ${attempts + 1} failed: ${error.message}`);
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, timeout));
        } else {
          return err("Failed to produce messages");
        }
      }
    }

    return err(`Failed to produce messages after ${maxAttempts} attempts`);
  }
}
