import {
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
  SQSClient,
  Message as SQSMessage,
} from "@aws-sdk/client-sqs";
import { LogManager } from "../../../managers/LogManager";
import { ScoreManager } from "../../../managers/score/ScoreManager";
import { SettingsManager } from "../../../utils/settings";
import { mapMessageDates } from "../../consumer/helpers/mapKafkaMessageToMessage";
import { QUEUE_URLS } from "../../producers/sqsTypes";

// do not go above 10, this is the max sqs can handle
const MAX_NUMBER_OF_MESSAGES = 10;
const SQS_CLIENT = new SQSClient({
  region: process.env.AWS_REGION,
});

const settingsManager = new SettingsManager();

const pullMessages = async ({
  sqs,
  queueUrl,
  count,
}: {
  sqs: SQSClient;
  queueUrl: string;
  count: number;
}) => {
  let remaining = count;
  let messages: SQSMessage[] = [];

  while (remaining > 0) {
    const isFirst = messages.length === 0;
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: Math.min(remaining, MAX_NUMBER_OF_MESSAGES),
      WaitTimeSeconds: isFirst ? 5 : 0,
    });
    const result = await sqs.send(command);
    if (result.Messages === undefined || result.Messages.length === 0) {
      break;
    }
    messages = messages.concat(result.Messages);
    remaining -= result.Messages.length;
  }
  return messages;
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
  const messagesPerMiniBatchSetting =
    await settingsManager.getSetting(sizeSetting);
  const count =
    messagesPerMiniBatchSetting?.messagesPerMiniBatch ?? MAX_NUMBER_OF_MESSAGES;

  // Pull messages
  const messages = await pullMessages({
    sqs: SQS_CLIENT,
    queueUrl,
    count,
  });

  if (messages.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    return;
  }

  try {
    await process(messages);

    const deletePromises = [];
    for (let i = 0; i < messages.length; i += 10) {
      const batch = messages.slice(i, i + 10);
      const entries = batch.map((msg) => ({
        Id: msg.MessageId,
        ReceiptHandle: msg.ReceiptHandle,
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
        const mappedMessages = messages.map((message) =>
          mapMessageDates(JSON.parse(message.Body ?? "{}")),
        );

        const logManager = new LogManager();
        await logManager.processLogEntries(mappedMessages, {});
      },
    });
  }
}

export async function consumeRequestResponseLogsLowPriority() {
  while (true) {
    await withMessages({
      queueUrl: QUEUE_URLS.requestResponseLogsLowPriority,
      sizeSetting: "sqs:request-response-logs", // TODO: Add a new setting for this
      process: async (messages) => {
        const mappedMessages = messages.map((message) =>
          mapMessageDates(JSON.parse(message.Body ?? "{}")),
        );

        const logManager = new LogManager();
        await logManager.processLogEntries(mappedMessages, {});
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
        const mappedMessages = messages.map((message) =>
          mapMessageDates(JSON.parse(message.Body ?? "{}")),
        );

        const logManager = new LogManager();
        await logManager.processLogEntries(mappedMessages, {});
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
        const mappedMessages = messages.map((message) =>
          JSON.parse(message.Body ?? "{}"),
        );

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
          mappedMessages,
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
        const mappedMessages = messages.map((message) =>
          JSON.parse(message.Body ?? "{}"),
        );

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
          mappedMessages,
        );
      },
    });
  }
}
