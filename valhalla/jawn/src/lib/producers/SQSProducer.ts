import { SendMessageBatchCommand, SQSClient } from "@aws-sdk/client-sqs";
import { err, ok, PromiseGenericResult } from "../../packages/common/result";
import {
  HeliconeScoresMessage,
  KafkaMessageContents,
} from "../handlers/HandlerContext";
import { MessageProducer, QueuePayload, QueueTopics } from "./types";
import { QUEUE_URLS } from "./sqsTypes";

const TOPIC_TO_SQS_QUEUE_MAP: Record<QueueTopics, string> = {
  "request-response-logs-prod": QUEUE_URLS.requestResponseLogs,
  "request-response-logs-prod-dlq": QUEUE_URLS.requestResponseLogsDlq,
  "helicone-scores-prod": QUEUE_URLS.heliconeScores,
  "helicone-scores-prod-dlq": QUEUE_URLS.heliconeScoresDlq,
} as const;

export class SQSProducer implements MessageProducer {
  private sqs: SQSClient;

  constructor() {
    if (
      !process.env.AWS_REGION ||
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.REQUEST_LOGS_QUEUE_URL
    ) {
      throw new Error(
        "Required AWS SQS environment variables are not set, SQSProducer will not be initialized."
      );
    }

    this.sqs = new SQSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendMessages({
    msgs,
    topic,
  }: QueuePayload): PromiseGenericResult<string> {
    let attempts = 0;
    const maxAttempts = 3;
    const timeout = 1000;

    while (attempts < maxAttempts) {
      try {
        while (msgs.length > 0) {
          const batchSize = 10;
          const batches = msgs.slice(0, batchSize);
          msgs = msgs.slice(batchSize);

          const command = new SendMessageBatchCommand({
            QueueUrl: TOPIC_TO_SQS_QUEUE_MAP[topic],
            Entries: batches.map((msg) => ({
              Id:
                topic === "request-response-logs-prod" ||
                topic === "request-response-logs-prod-dlq"
                  ? (msg as KafkaMessageContents).log.request.id
                  : (msg as HeliconeScoresMessage).requestId,
              MessageBody: JSON.stringify(msg),
            })),
          });

          await this.sqs.send(command);
        }

        return ok("Success");
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

  async sendScoresMessage(payload: QueuePayload): PromiseGenericResult<string> {
    return this.sendMessages(payload);
  }
}
