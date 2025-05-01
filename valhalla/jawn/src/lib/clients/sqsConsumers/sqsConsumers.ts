import {
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
  SQSClient,
  Message as SQSMessage,
} from "@aws-sdk/client-sqs";
import { LogManager } from "../../../managers/LogManager";
import { ScoreManager } from "../../../managers/score/ScoreManager";
import { SettingsManager } from "../../../utils/settings";
import { mapDlqKafkaMessageToMessage } from "../../consumer/helpers/mapDlqKafkaMessageToMessage";
import { mapKafkaMessageToMessage } from "../../consumer/helpers/mapKafkaMessageToMessage";
import { mapKafkaMessageToScoresMessage } from "../../consumer/helpers/mapKafkaMessageToScoresMessage";

// do not go above 10, this is the max sqs can handle
const MAX_NUMBER_OF_MESSAGES = 10;
const QUEUE_NAMES = {
  requestResponseLogs: "request-response-logs-queue",
  heliconeScores: "helicone-scores-queue",
  requestResponseLogsDlq: "request-response-logs-dlq",
  heliconeScoresDlq: "helicone-scores-dlq",
} as const;

const QUEUE_URLS = {
  requestResponseLogs: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.requestResponseLogs}`,
  heliconeScores: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.heliconeScores}`,
  requestResponseLogsDlq: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.requestResponseLogsDlq}`,
  heliconeScoresDlq: `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${QUEUE_NAMES.heliconeScoresDlq}`,
} as const;
const SQS_CLIENT = new SQSClient({
  region: process.env.AWS_REGION,
});

const settingsManager = new SettingsManager();

const pullMessages = async ({
  sqs,
  queueUrl,
  count,
  accumulatedMessages = [],
}: {
  sqs: SQSClient;
  queueUrl: string;
  count: number;
  accumulatedMessages: SQSMessage[];
}) => {
  const command = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: count,
  });
  const result = await sqs.send(command);
  if (result.Messages === undefined || result.Messages.length === 0) {
    return accumulatedMessages;
  }
  return pullMessages({
    sqs,
    queueUrl,
    count: count - result.Messages.length,
    accumulatedMessages: [...accumulatedMessages, ...result.Messages],
  });
};

async function withMessages({
  queueUrl,
  process,
  sizeSetting,
}: {
  queueUrl: string;
  process: (messages: SQSMessage[]) => Promise<void>;
  sizeSetting:
    | "sqs:request-response-logs"
    | "sqs:helicone-scores"
    | "sqs:request-response-logs-dlq"
    | "sqs:helicone-scores-dlq";
}): Promise<void> {
  const messagesPerMiniBatchSetting = await settingsManager.getSetting(
    sizeSetting
  );
  const count =
    messagesPerMiniBatchSetting?.messagesPerMiniBatch ?? MAX_NUMBER_OF_MESSAGES;

  // Pull messages
  const messages = await pullMessages({
    sqs: SQS_CLIENT,
    queueUrl,
    count,
    accumulatedMessages: [],
  });

  if (messages.length === 0) {
    console.log("No messages to process");
    return;
  }

  try {
    await process(messages);

    const deletePromises = [];
    for (let i = 0; i < messages.length; i += 10) {
      const batch = messages.slice(i, i + 10);
      const entries = batch.map((msg, idx) => ({
        Id: `${i + idx}`,
        ReceiptHandle: msg.ReceiptHandle!,
      }));

      const deleteCommand = new DeleteMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      });

      deletePromises.push(SQS_CLIENT.send(deleteCommand));
    }

    const deleteResults = await Promise.all(deletePromises);

    for (const result of deleteResults) {
      if (result.Failed && result.Failed.length > 0) {
        console.error("Failed to delete some messages:", result.Failed);
      }
    }
  } catch (error) {
    console.error("Error processing messages:", error);
  }
}

export async function consumeRequestResponseLogs() {
  while (true) {
    await withMessages({
      queueUrl: QUEUE_URLS.requestResponseLogs,
      sizeSetting: "sqs:request-response-logs",
      process: async (messages) => {
        const mappedMessages = mapKafkaMessageToMessage(
          messages.map((message) => JSON.parse(message.Body ?? "{}"))
        );
        if (mappedMessages.error || !mappedMessages.data) {
          console.error("Failed to map messages", mappedMessages.error);
          throw new Error("Failed to map messages");
        }

        const logManager = new LogManager();
        await logManager.processLogEntries(mappedMessages.data, {});
      },
    });
  }
}

export async function consumeRequestResponseLogsDlq() {
  while (true) {
    await withMessages({
      queueUrl: QUEUE_URLS.requestResponseLogsDlq,
      sizeSetting: "sqs:request-response-logs-dlq",
      process: async (messages) => {
        const mappedMessages = mapDlqKafkaMessageToMessage(
          messages.map((message) => JSON.parse(message.Body ?? "{}"))
        );
        if (mappedMessages.error || !mappedMessages.data) {
          console.error("Failed to map messages", mappedMessages.error);
          throw new Error("Failed to map messages");
        }

        const logManager = new LogManager();
        await logManager.processLogEntries(mappedMessages.data, {});
      },
    });
  }
}

export async function consumeHeliconeScores() {
  while (true) {
    await withMessages({
      queueUrl: QUEUE_URLS.heliconeScores,
      sizeSetting: "sqs:helicone-scores",
      process: async (messages) => {
        const mappedMessages = mapKafkaMessageToScoresMessage(
          messages.map((message) => JSON.parse(message.Body ?? "{}"))
        );
        if (mappedMessages.error || !mappedMessages.data) {
          console.error("Failed to map messages", mappedMessages.error);
          throw new Error("Failed to map messages");
        }

        const scoresManager = new ScoreManager({
          organizationId: "",
        });
        await scoresManager.handleScores(
          {
            batchId: "",
            partition: 0,
            lastOffset: "",
            messageCount: messages.length,
          },
          mappedMessages.data
        );
      },
    });
  }
}

export async function consumeHeliconeScoresDlq() {
  while (true) {
    await withMessages({
      queueUrl: QUEUE_URLS.heliconeScoresDlq,
      sizeSetting: "sqs:helicone-scores-dlq",
      process: async (messages) => {
        const mappedMessages = mapKafkaMessageToScoresMessage(
          messages.map((message) => JSON.parse(message.Body ?? "{}"))
        );
        if (mappedMessages.error || !mappedMessages.data) {
          console.error("Failed to map messages", mappedMessages.error);
          throw new Error("Failed to map messages");
        }

        const scoresManager = new ScoreManager({
          organizationId: "",
        });
        await scoresManager.handleScores(
          {
            batchId: "",
            partition: 0,
            lastOffset: "",
            messageCount: messages.length,
          },
          mappedMessages.data
        );
      },
    });
  }
}
