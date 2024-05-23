import * as Sentry from "@sentry/node";
import { KafkaMessage } from "kafkajs";
import { LogManager } from "../../../managers/LogManager";
import { Message } from "../../handlers/HandlerContext";
import {
  GenericResult,
  PromiseGenericResult,
  err,
  ok,
} from "../../shared/result";
import { Topics } from "../KafkaProducer";
import { generateKafkaConsumer } from "./client";
import {
  DLQ_ESTIMATED_MINI_BATCH_COUNT,
  DLQ_MESSAGES_PER_MINI_BATCH,
  ESTIMATED_MINI_BATCH_COUNT,
  MESSAGES_PER_MINI_BATCH,
} from "./constant";
import { SettingsManager } from "../../../utils/settings";

const KAFKA_CREDS = JSON.parse(process.env.KAFKA_CREDS ?? "{}");
const KAFKA_ENABLED = (KAFKA_CREDS?.KAFKA_ENABLED ?? "false") === "true";
const settingsManager = new SettingsManager();

// Average message is 1kB, so we can set minBytes to 1kB and maxBytes to 10kB

export const consume = async () => {
  const consumer = generateKafkaConsumer("jawn-consumer");
  if (KAFKA_ENABLED && !consumer) {
    console.error("Failed to create Kafka consumer");
    return;
  }

  let retryDelay = 100;
  const maxDelay = 30000;

  while (true) {
    try {
      await consumer?.connect();
      console.log("Successfully connected to Kafka");
      break;
    } catch (error: any) {
      console.error(`Failed to connect to Kafka: ${error.message}`);
      console.log(`Retrying in ${retryDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retryDelay = Math.min(retryDelay * 2, maxDelay); // Exponential backoff with a cap
    }
  }

  await consumer?.connect();
  await consumer?.subscribe({
    topic: "request-response-logs-prod",
    fromBeginning: true,
  });

  await consumer?.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
    }) => {
      console.log(`Received batch with ${batch.messages.length} messages.`);
      const messagesPerMiniBatchSetting = await settingsManager.getSetting(
        "kafka:log"
      );

      const miniBatches = createMiniBatches(
        batch.messages,
        messagesPerMiniBatchSetting?.miniBatchSize ?? MESSAGES_PER_MINI_BATCH
      );

      for (const miniBatch of miniBatches) {
        const firstOffset = miniBatch[0].offset;
        const lastOffset = miniBatch[miniBatch.length - 1].offset;
        const miniBatchId = `${batch.partition}-${firstOffset}-${lastOffset}`;
        try {
          const mappedMessages = mapKafkaMessageToMessage(miniBatch);
          if (mappedMessages.error || !mappedMessages.data) {
            console.error("Failed to map messages", mappedMessages.error);
            return;
          }

          const consumeResult = await consumeMiniBatch(
            mappedMessages.data,
            firstOffset,
            lastOffset,
            miniBatchId,
            batch.partition,
            "request-response-logs-prod"
          );

          if (consumeResult.error) {
            console.error("Failed to consume batch", consumeResult.error);
          }
        } catch (error) {
          console.error("Failed to consume batch", error);
        } finally {
          resolveOffset(lastOffset);
          await heartbeat();
        }
      }

      await commitOffsetsIfNecessary();
    },
  });
};

function mapKafkaMessageToMessage(
  kafkaMessage: KafkaMessage[]
): GenericResult<Message[]> {
  const messages: Message[] = [];
  for (const message of kafkaMessage) {
    if (message.value) {
      try {
        const kafkaValue = JSON.parse(message.value.toString());
        const parsedMsg = JSON.parse(kafkaValue.value) as Message;
        messages.push(mapMessageDates(parsedMsg));
      } catch (error) {
        return err(`Failed to parse message: ${error}`);
      }
    } else {
      return err("Message value is empty");
    }
  }

  return ok(messages);
}

function mapMessageDates(message: Message): Message {
  return {
    ...message,
    log: {
      ...message.log,
      request: {
        ...message.log.request,
        requestCreatedAt: new Date(message.log.request.requestCreatedAt),
      },
      response: {
        ...message.log.response,
        responseCreatedAt: new Date(message.log.response.responseCreatedAt),
      },
    },
  };
}

export const consumeDlq = async () => {
  const dlqConsumer = generateKafkaConsumer("jawn-consumer-local-01");
  if (KAFKA_ENABLED && !dlqConsumer) {
    console.error("Failed to create Kafka dlq consumer");
    return;
  }

  let retryDelay = 100;
  const maxDelay = 30000;

  while (true) {
    try {
      await dlqConsumer?.connect();
      console.log("Successfully connected to DLQ Kafka");
      break;
    } catch (error: any) {
      console.error(`Failed to connect to DLQ Kafka: ${error.message}`);
      console.log(`Retrying in ${retryDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retryDelay = Math.min(retryDelay * 2, maxDelay); // Exponential backoff with a cap
    }
  }

  await dlqConsumer?.connect();
  await dlqConsumer?.subscribe({
    topic: "request-response-logs-prod-dlq",
    fromBeginning: true,
  });

  await dlqConsumer?.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
    }) => {
      console.log(
        `DLQ: Received batch with ${batch.messages.length} messages.`
      );

      const messagesPerMiniBatchSetting = await settingsManager.getSetting(
        "kafka:dlq"
      );

      const miniBatches = createMiniBatches(
        batch.messages,
        messagesPerMiniBatchSetting?.miniBatchSize ??
          DLQ_MESSAGES_PER_MINI_BATCH
      );

      for (const miniBatch of miniBatches) {
        const firstOffset = miniBatch[0].offset;
        const lastOffset = miniBatch[miniBatch.length - 1].offset;
        const miniBatchId = `${batch.partition}-${firstOffset}-${lastOffset}`;

        try {
          const mappedMessages = mapDlqKafkaMessageToMessage(miniBatch);
          if (mappedMessages.error || !mappedMessages.data) {
            console.error("DLQ: Failed to map messages", mappedMessages.error);
            return;
          }

          const consumeResult = await consumeMiniBatch(
            mappedMessages.data,
            firstOffset,
            lastOffset,
            miniBatchId,
            batch.partition,
            "request-response-logs-prod-dlq"
          );
          if (consumeResult.error) {
            console.error("DLQ: Failed to consume batch", consumeResult.error);
          }
        } catch (error) {
          console.error("DLQ: Failed to consume batch", error);
        } finally {
          resolveOffset(lastOffset);
          await heartbeat();
        }
      }

      await commitOffsetsIfNecessary();
    },
  });
};

function mapDlqKafkaMessageToMessage(
  kafkaMessage: KafkaMessage[]
): GenericResult<Message[]> {
  const messages: Message[] = [];
  for (const message of kafkaMessage) {
    if (message.value) {
      try {
        const kafkaValue = JSON.parse(message.value.toString());
        messages.push(mapMessageDates(kafkaValue));
      } catch (error) {
        return err(`Failed to parse message: ${error}`);
      }
    } else {
      return err("Message value is empty");
    }
  }

  return ok(messages);
}

async function consumeMiniBatch(
  messages: Message[],
  firstOffset: string,
  lastOffset: string,
  miniBatchId: string,
  batchPartition: number,
  topic: Topics
): PromiseGenericResult<string> {
  console.log(
    `Received mini batch with ${messages.length} messages. Mini batch ID: ${miniBatchId}. Topic: ${topic}`
  );

  const logManager = new LogManager();

  try {
    await logManager.processLogEntries(messages, {
      batchId: miniBatchId,
      partition: batchPartition,
      lastOffset: lastOffset,
      messageCount: messages.length,
    });
    return ok(miniBatchId);
  } catch (error) {
    // TODO: Should we skip or fail the batch?
    Sentry.captureException(error, {
      tags: {
        type: "ConsumeError",
        topic: topic,
      },
      extra: {
        batchId: batchPartition,
        partition: batchPartition,
        offset: firstOffset,
        messageCount: messages.length,
      },
    });
    return err(`Failed to process batch ${miniBatchId}, error: ${error}`);
  }
}

function createMiniBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize);
    batches.push(batch);
  }
  return batches;
}
