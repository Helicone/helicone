import { Kafka, logLevel } from "kafkajs";
import { LogManager } from "../../managers/LogManager";
import { Message } from "../handlers/HandlerContext";

let kafka;
if (
  process.env.KAFKA_ENABLED &&
  process.env.UPSTASH_KAFKA_BROKER &&
  process.env.UPSTASH_KAFKA_USERNAME &&
  process.env.UPSTASH_KAFKA_PASSWORD
) {
  kafka = new Kafka({
    brokers: [process.env.UPSTASH_KAFKA_BROKER],
    sasl: {
      mechanism: "scram-sha-512",
      username: process.env.UPSTASH_KAFKA_USERNAME,
      password: process.env.UPSTASH_KAFKA_PASSWORD,
    },
    ssl: true,
    logLevel: logLevel.ERROR,
  });
} else {
  if (!process.env.KAFKA_ENABLED) {
    console.log("Kafka is disabled.");
  } else {
    console.error("Required Kafka environment variables are not set.");
  }
}

// Average message is 1.12KB, with 1MB max batch size, we can have ~1000 messages per batch
const consumer = kafka?.consumer({
  groupId: "helicone",
  maxBytes: 1024 * 1024,
});

export const consume = async () => {
  if (process.env.KAFKA_ENABLED && !consumer) {
    console.error("Failed to create Kafka consumer");
    return;
  }

  console.log("Starting batch consumption");
  await consumer?.connect();
  await consumer?.subscribe({
    topic: "logs",
    fromBeginning: true,
  });

  await consumer?.run({
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
    }) => {
      const batchId = `${
        batch.partition
      }-${batch.firstOffset()}-${batch.lastOffset()}`;

      const messages = batch.messages
        .map((message) => {
          if (message.value) {
            try {
              const kafkaValue = JSON.parse(message.value.toString());
              const parsedMsg = JSON.parse(kafkaValue.value) as Message;
              return mapMessageDates(parsedMsg);
            } catch (error) {
              console.error("Failed to parse message:", error);
              return null;
            }
          }
          return null;
        })
        .filter((msg) => msg !== null) as Message[];

      try {
        const logManager = new LogManager();
        console.log(
          `Processing batch ${batchId} with ${messages.length} messages`
        );
        await logManager.processLogEntries(messages, batchId);
        resolveOffset(batch.messages[batch.messages.length - 1].offset);
        await commitOffsetsIfNecessary();
        await heartbeat();
      } catch (error) {
        console.error("Failed to process batch", error);
        // Handle failure: you might want to log the error and decide how to proceed
        // Depending on the nature of the failure, you might choose to retry or skip this batch
      }
    },
  });
};

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
