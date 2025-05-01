import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Env } from "../../..";
import { MessageData, MessageProducer } from "./types";

export class SQSProducerImpl implements MessageProducer {
  private sqs: SQSClient;
  private queueUrl: string;

  constructor(env: Env) {
    if (
      !env.AWS_REGION ||
      !env.AWS_ACCESS_KEY_ID ||
      !env.AWS_SECRET_ACCESS_KEY ||
      !env.REQUEST_LOGS_QUEUE_URL
    ) {
      throw new Error(
        "Required AWS SQS environment variables are not set, SQSProducer will not be initialized."
      );
    }

    this.sqs = new SQSClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.queueUrl = env.REQUEST_LOGS_QUEUE_URL;
  }

  async sendMessage(msg: MessageData) {
    let attempts = 0;
    const maxAttempts = 3;
    const timeout = 1000;

    while (attempts < maxAttempts) {
      try {
        const command = new SendMessageCommand({
          QueueUrl: this.queueUrl,
          MessageBody: JSON.stringify(msg),
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
          throw new Error(`Failed to send message to SQS: ${error.message}`);
        }
      }
    }
  }
}
