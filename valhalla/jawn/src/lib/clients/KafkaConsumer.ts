import { Batch, Kafka, logLevel } from "kafkajs";
import { LogManager } from "../../managers/LogManager";
import { Message } from "../handlers/HandlerContext";
import { PromiseGenericResult, err, ok } from "../shared/result";

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
  groupId: "jawn-consumer",
  maxBytes: 1024 * 1024,
});

process.on("exit", async () => {
  await consumer?.stop();
  await consumer?.disconnect();
  console.log("Consumer disconnected.");
});

export const consume = async () => {
  if (process.env.KAFKA_ENABLED && !consumer) {
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
    topic: "request-response-logs",
    fromBeginning: true,
  });

  await consumer?.run({
    eachBatchAutoResolve: true,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
      isRunning,
      isStale,
      uncommittedOffsets,
    }) => {
      const consumeResult = await consumeBatch(batch);

      if (consumeResult.error) {
        console.error("Failed to consume batch", consumeResult.error);
        // TODO: Best way to handle this?
        return;
      } else {
        resolveOffset(batch.messages[batch.messages.length - 1].offset);
        await commitOffsetsIfNecessary();
        await heartbeat();
      }
    },
  });
};

async function consumeBatch(batch: Batch): PromiseGenericResult<string> {
  const batchId = `${
    batch.partition
  }-${batch.firstOffset()}-${batch.lastOffset()}`;

  console.log(
    `Received batch with ${
      batch.messages.length
    } messages. Offset: ${batch.firstOffset()}`
  );

  const messages: Message[] = [];
  for (const message of batch.messages) {
    if (message.value) {
      try {
        const kafkaValue = JSON.parse(message.value.toString());
        const parsedMsg = JSON.parse(kafkaValue.value) as Message;
        messages.push(mapMessageDates(parsedMsg));
      } catch (error) {
        // TODO: Should we skip or fail the message?
        return err(
          `Failed to parse message: ${error}, message: ${JSON.stringify(
            message
          )}`
        );
      }
    } else {
      // TODO: Should we skip or fail the batch?
      return err("Message value is empty");
    }
  }

  const logManager = new LogManager();

  try {
    await logManager.processLogEntries(messages, batchId);
    return ok(batchId);
  } catch (error) {
    // TODO: Should we skip or fail the batch?
    return err(`Failed to process batch ${batchId}, error: ${error}`);
  }
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
