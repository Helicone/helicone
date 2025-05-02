import * as Sentry from "@sentry/node";
import { LogManager } from "../../managers/LogManager";
import { PromiseGenericResult, ok, err } from "../../packages/common/result";
import { KafkaMessageContents } from "../handlers/HandlerContext";
<<<<<<< Updated upstream
import { Topics } from "../clients/KafkaProducer";
=======
import { Topics } from "../clients/HeliconeQuequeProducer";
>>>>>>> Stashed changes

export async function consumeMiniBatch(
  messages: KafkaMessageContents[],
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
