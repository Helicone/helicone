import * as Sentry from "@sentry/node";
import { ScoreManager } from "../../managers/score/ScoreManager";
import { PromiseGenericResult, err, ok } from "../../packages/common/result";
import { Topics } from "../clients/KafkaProducer";
import { HeliconeScoresMessage } from "../handlers/HandlerContext";

export async function consumeMiniBatchScores(
  messages: HeliconeScoresMessage[],
  firstOffset: string,
  lastOffset: string,
  miniBatchId: string,
  batchPartition: number,
  topic: Topics
): PromiseGenericResult<string> {
  console.log(
    `Received mini batch with ${messages.length} messages. Mini batch ID: ${miniBatchId}. Topic: ${topic}`
  );

  const scoresManager = new ScoreManager({
    organizationId: "",
  });

  try {
    await scoresManager.handleScores(
      {
        batchId: miniBatchId,
        partition: batchPartition,
        lastOffset: lastOffset,
        messageCount: messages.length,
      },
      messages
    );
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
