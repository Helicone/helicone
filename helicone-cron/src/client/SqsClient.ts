import { Env } from "..";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";

export class SqsClient {
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

  async getQueueSize(): Promise<number | null> {
    const command = new GetQueueAttributesCommand({
      QueueUrl: this.queueUrl,
      AttributeNames: ["ApproximateNumberOfMessages"],
    });
    const response = await this.sqs.send(command);
    return response.Attributes?.ApproximateNumberOfMessages
      ? Number(response.Attributes.ApproximateNumberOfMessages)
      : null;
  }
}
