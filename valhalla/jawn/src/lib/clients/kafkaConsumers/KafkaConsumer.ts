import { SettingsManager } from "../../../utils/settings";
import { consumeMiniBatch } from "../../consumer/consumeMiniBatch";
import { generateKafkaAdmin, generateKafkaConsumer } from "./client";
import {
  DLQ_MESSAGES_PER_MINI_BATCH,
  MESSAGES_PER_MINI_BATCH,
  SCORES_MESSAGES_PER_MINI_BATCH,
} from "./constant";

import { consumeMiniBatchScores } from "../../consumer/consumeMiniBatchScores";
import { mapDlqKafkaMessageToMessage } from "../../consumer/helpers/mapDlqKafkaMessageToMessage";
import { mapKafkaMessageToMessage } from "../../consumer/helpers/mapKafkaMessageToMessage";
import { mapKafkaMessageToScoresMessage } from "../../consumer/helpers/mapKafkaMessageToScoresMessage";

const KAFKA_CREDS = JSON.parse(process.env.KAFKA_CREDS ?? "{}");
const KAFKA_ENABLED = (KAFKA_CREDS?.KAFKA_ENABLED ?? "false") === "true";
const settingsManager = new SettingsManager();

// Average message is 1kB, so we can set minBytes to 1kB and maxBytes to 10kB
export const consume = async ({
  startTimestamp,
  endTimestamp,
  miniBatchSizeOverride,
  filter,
  consumerName,
}:
  | {
      startTimestamp?: number;
      endTimestamp?: number;
      miniBatchSizeOverride?: number;
      filter?: {
        stream?: "only-stream";
      };
      consumerName: "jawn-consumer-backfill";
    }
  | {
      startTimestamp?: number;
      endTimestamp?: number;
      miniBatchSizeOverride?: number;
      filter?: undefined;
      consumerName: "jawn-consumer";
    }) => {
  const consumer = generateKafkaConsumer(consumerName);
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
      retryDelay = Math.min(retryDelay * 2, maxDelay);
    }
  }

  const topic = "request-response-logs-prod";
  await consumer?.subscribe({
    topic: "request-response-logs-prod",
    fromBeginning: true,
  });

  let hasPerformedInitialSeek = false;
  await consumer?.run({
    eachBatchAutoResolve: false,

    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
    }) => {
      // Perform seek operation only once, at the beginning
      if (startTimestamp && !hasPerformedInitialSeek) {
        try {
          const admin = generateKafkaAdmin();
          await admin?.connect();
          const result = await admin?.fetchTopicOffsetsByTimestamp(
            topic,
            startTimestamp,
          );

          for (const { partition, offset } of result ?? []) {
            await consumer?.seek({ topic, partition, offset });
          }

          await admin?.disconnect();
          hasPerformedInitialSeek = true;
          return;
        } catch (error) {
          console.error("Failed to seek to start timestamp:", error);
          // Decide whether to continue or throw an error based on your requirements
        }
      }

      console.log(`Received batch with ${batch.messages.length} messages.`);

      try {
        let i = 0;

        while (i < batch.messages.length) {
          const messagesPerMiniBatchSetting =
            await settingsManager.getSetting("kafka:log");

          const miniBatchSize =
            miniBatchSizeOverride ??
            messagesPerMiniBatchSetting?.miniBatchSize ??
            MESSAGES_PER_MINI_BATCH;

          if (miniBatchSize <= 0) {
            // sleep for 10 second
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            return;
          }

          const miniBatch = batch.messages.slice(i, miniBatchSize + i);

          const firstOffset = miniBatch?.[0]?.offset;
          const lastOffset = miniBatch?.[miniBatch.length - 1]?.offset;
          const miniBatchId = `${batch.partition}-${firstOffset}-${lastOffset}`;
          console.log(
            `Processing mini batch with ${
              miniBatch.length
            } messages. Mini batch ID: ${miniBatchId}. Handling ${i}-${
              i + miniBatchSize
            } of ${batch.messages.length} messages.`,
          );

          i += miniBatchSize;
          try {
            const mappedMessages = mapKafkaMessageToMessage(miniBatch);

            if (mappedMessages.error || !mappedMessages.data) {
              console.error("Failed to map messages", mappedMessages.error);
              return;
            }

            // Filter messages based on timestamp if endTimestamp is provided
            let filteredMessages = endTimestamp
              ? mappedMessages.data.filter(
                  (msg) =>
                    new Date(msg.log.request.requestCreatedAt).getTime() <=
                    endTimestamp,
                )
              : mappedMessages.data;

            filteredMessages =
              filter?.stream === "only-stream"
                ? mappedMessages.data.filter((msg) => msg.log.request.isStream)
                : mappedMessages.data;

            if (filteredMessages.length === 0) {
              // If all messages are beyond the end timestamp, stop consuming
              if (
                endTimestamp &&
                mappedMessages.data[0].log.request.requestCreatedAt.getTime() >
                  endTimestamp
              ) {
                console.log("Reached end timestamp, stopping consumption");

                return;
              }
              continue;
            }

            const consumeResult = await consumeMiniBatch(
              filteredMessages,
              firstOffset,
              lastOffset,
              miniBatchId,
              batch.partition,
              topic,
            );

            if (consumeResult.error) {
              console.error("Failed to consume batch", consumeResult.error);
            }
          } catch (error) {
            console.error("Failed to consume batch", error);
          } finally {
            resolveOffset(lastOffset);
            await heartbeat();
            await commitOffsetsIfNecessary();
          }
        }
      } catch (error) {
        console.error("Failed to consume batch", error);
      } finally {
        await commitOffsetsIfNecessary();
      }
    },
  });
};
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
        `DLQ: Received batch with ${batch.messages.length} messages.`,
      );

      const messagesPerMiniBatchSetting =
        await settingsManager.getSetting("kafka:dlq");

      const miniBatchSize =
        messagesPerMiniBatchSetting?.miniBatchSize ??
        DLQ_MESSAGES_PER_MINI_BATCH;
      if (miniBatchSize <= 0) {
        // sleep for 10 second
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return;
      }

      const miniBatches = createMiniBatches(batch.messages, miniBatchSize);

      try {
        for (const miniBatch of miniBatches) {
          const firstOffset = miniBatch[0].offset;
          const lastOffset = miniBatch[miniBatch.length - 1].offset;
          const miniBatchId = `${batch.partition}-${firstOffset}-${lastOffset}`;

          try {
            const mappedMessages = mapDlqKafkaMessageToMessage(miniBatch);
            if (mappedMessages.error || !mappedMessages.data) {
              console.error(
                "DLQ: Failed to map messages",
                mappedMessages.error,
              );
              return;
            }

            const consumeResult = await consumeMiniBatch(
              mappedMessages.data,
              firstOffset,
              lastOffset,
              miniBatchId,
              batch.partition,
              "request-response-logs-prod-dlq",
            );
            if (consumeResult.error) {
              console.error(
                "DLQ: Failed to consume batch",
                consumeResult.error,
              );
            }
          } catch (error) {
            console.error("DLQ: Failed to consume batch", error);
          } finally {
            resolveOffset(lastOffset);
            await heartbeat();
            await commitOffsetsIfNecessary();
          }
        }
      } catch (error) {
        console.error("DLQ: Failed to consume batch", error);
      } finally {
        await commitOffsetsIfNecessary();
      }
    },
  });
};

export const consumeScores = async () => {
  const consumer = generateKafkaConsumer("jawn-consumer-scores");
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
    topic: "helicone-scores-prod",
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

      try {
        let i = 0;

        while (i < batch.messages.length) {
          const messagesPerMiniBatchSetting =
            await settingsManager.getSetting("kafka:score");

          const miniBatchSize =
            messagesPerMiniBatchSetting?.miniBatchSize ??
            SCORES_MESSAGES_PER_MINI_BATCH;

          if (miniBatchSize <= 0) {
            // sleep for 10 second
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            return;
          }

          const miniBatch = batch.messages.slice(i, miniBatchSize + i);

          const firstOffset = miniBatch?.[0]?.offset;
          const lastOffset = miniBatch?.[miniBatch.length - 1]?.offset;
          const miniBatchId = `${batch.partition}-${firstOffset}-${lastOffset}`;
          console.log(
            `Processing mini batch with ${
              miniBatch.length
            } messages. Mini batch ID: ${miniBatchId}. Handling ${i}-${
              i + miniBatchSize
            } of ${batch.messages.length} messages.`,
          );

          i += miniBatchSize;
          try {
            const mappedMessages = mapKafkaMessageToScoresMessage(miniBatch);
            if (mappedMessages.error || !mappedMessages.data) {
              console.error("Failed to map messages", mappedMessages.error);
              return;
            }

            const consumeResult = await consumeMiniBatchScores(
              mappedMessages.data,
              firstOffset,
              lastOffset,
              miniBatchId,
              batch.partition,
              "helicone-scores-prod",
            );

            if (consumeResult.error) {
              console.error("Failed to consume batch", consumeResult.error);
            }
          } catch (error) {
            console.error("Failed to consume batch", error);
          } finally {
            resolveOffset(lastOffset);
            await heartbeat();
            await commitOffsetsIfNecessary();
          }
        }
      } catch (error) {
        console.error("Failed to consume batch", error);
      } finally {
        await commitOffsetsIfNecessary();
      }
    },
  });
};

export const consumeScoresDlq = async () => {
  const consumer = generateKafkaConsumer("jawn-consumer-scores-dlq");
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
    topic: "helicone-scores-prod-dlq",
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

      try {
        let i = 0;

        while (i < batch.messages.length) {
          const messagesPerMiniBatchSetting =
            await settingsManager.getSetting("kafka:dlq:score");

          const miniBatchSize =
            messagesPerMiniBatchSetting?.miniBatchSize ??
            DLQ_MESSAGES_PER_MINI_BATCH;

          if (miniBatchSize <= 0) {
            // sleep for 10 second
            await new Promise((resolve) => setTimeout(resolve, 10_000));
            return;
          }

          const miniBatch = batch.messages.slice(i, miniBatchSize + i);

          const firstOffset = miniBatch?.[0]?.offset;
          const lastOffset = miniBatch?.[miniBatch.length - 1]?.offset;
          const miniBatchId = `${batch.partition}-${firstOffset}-${lastOffset}`;
          console.log(
            `Processing mini batch with ${
              miniBatch.length
            } messages. Mini batch ID: ${miniBatchId}. Handling ${i}-${
              i + miniBatchSize
            } of ${batch.messages.length} messages.`,
          );

          i += miniBatchSize;
          try {
            const mappedMessages = mapKafkaMessageToScoresMessage(miniBatch);
            if (mappedMessages.error || !mappedMessages.data) {
              console.error("Failed to map messages", mappedMessages.error);
              return;
            }

            const consumeResult = await consumeMiniBatchScores(
              mappedMessages.data,
              firstOffset,
              lastOffset,
              miniBatchId,
              batch.partition,
              "helicone-scores-prod-dlq",
            );

            if (consumeResult.error) {
              console.error("Failed to consume batch", consumeResult.error);
            }
          } catch (error) {
            console.error("Failed to consume batch", error);
          } finally {
            resolveOffset(lastOffset);
            await heartbeat();
            await commitOffsetsIfNecessary();
          }
        }
      } catch (error) {
        console.error("Failed to consume batch", error);
      } finally {
        await commitOffsetsIfNecessary();
      }
    },
  });
};

function createMiniBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize);
    batches.push(batch);
  }
  return batches;
}
