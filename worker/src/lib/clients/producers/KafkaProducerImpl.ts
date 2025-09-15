import { Kafka } from "@upstash/kafka";
import { MessageData, MessageProducer } from "./types";
import { err, ok, Result } from "@helicone/gateway";

export class KafkaProducerImpl implements MessageProducer {
  private kafka: Kafka;

  constructor(env: Env) {
    if (
      !env.UPSTASH_KAFKA_URL ||
      !env.UPSTASH_KAFKA_USERNAME ||
      !env.UPSTASH_KAFKA_PASSWORD
    ) {
      throw new Error(
        "Required Kafka environment variables are not set, KafkaProducer will not be initialized."
      );
    }
    this.kafka = new Kafka({
      url: env.UPSTASH_KAFKA_URL,
      username: env.UPSTASH_KAFKA_USERNAME,
      password: env.UPSTASH_KAFKA_PASSWORD,
    });
  }

  setLowerPriority() {
    // Do nothing since this is deprecated to SQS
  }

  async sendMessage(msg: MessageData): Promise<Result<null, string>> {
    const producer = this.kafka.producer();

    let attempts = 0;
    const maxAttempts = 3;
    const timeout = 1000;

    while (attempts < maxAttempts) {
      try {
        const message = JSON.stringify({
          value: JSON.stringify(msg),
        });

        await producer.produce("request-response-logs-prod", message, {
          key: msg.log.request.id,
        });

        return ok(null);
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
    return err(`Failed to produce message`);
  }
}