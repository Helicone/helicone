import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Env } from "../../..";
import { MessageData, MessageProducer } from "./types";
import { Result, err, ok } from "../../util/results";

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
      if (!env.AWS_REGION) {
        console.log("AWS_REGION is not set, using eu-west-1");
        // env.AWS_REGION = "eu-west-1";
      }
      if (!env.AWS_ACCESS_KEY_ID) {
        console.log("AWS_ACCESS_KEY_ID is not set, using eu-west-1");
        // env.AWS_ACCESS_KEY_ID = "eu-west-1";
      }
      if (!env.AWS_SECRET_ACCESS_KEY) {
        console.log("AWS_SECRET_ACCESS_KEY is not set, using eu-west-1");
        // env.AWS_SECRET_ACCESS_KEY = "eu-west-1";
      }
      if (!env.REQUEST_LOGS_QUEUE_URL) {
        console.log("REQUEST_LOGS_QUEUE_URL is not set, using eu-west-1");
        // env.REQUEST_LOGS_QUEUE_URL = "eu-west-1";
      }
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

  async sendMessage(msg: MessageData): Promise<Result<null, string>> {
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
        return ok(null);
      } catch (error: any) {
        console.log(`SQS attempt ${attempts + 1} failed: ${error.message}`);
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, timeout));
        } else {
          console.error(`Failed to send message to SQS: ${error.message}`);
          return err(`Failed to send message to SQS: ${error.message}`);
        }
      }
    }
    return err(`Failed to send message to SQS`);
  }
}
