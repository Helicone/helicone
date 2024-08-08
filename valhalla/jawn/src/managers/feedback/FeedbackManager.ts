import { dataDogClient } from "../../lib/clients/DataDogClient";
import { KafkaProducer } from "../../lib/clients/KafkaProducer";
import * as Sentry from "@sentry/node";
import { HeliconeFeedbackMessage } from "../../lib/handlers/HandlerContext";
import { err, ok, Result } from "../../lib/shared/result";
import { ScoreStore } from "../../lib/stores/ScoreStore";

export class FeedbackManager {
  private scoreStore: ScoreStore;
  constructor() {
    this.scoreStore = new ScoreStore("");
  }
  private async processFeedback(feedbackMessages: HeliconeFeedbackMessage[]) {
    try {
      // Filter out duplicate feedback messages and only keep the latest one
      const filteredMessages = Array.from(
        feedbackMessages
          .reduce((map, message) => {
            const existingMessage = map.get(message.requestId);
            if (
              !existingMessage ||
              existingMessage.createdAt < message.createdAt
            ) {
              map.set(message.requestId, message);
            }
            return map;
          }, new Map<string, HeliconeFeedbackMessage>())
          .values()
      );
      const bumpedVersions = await this.scoreStore.bumpRequestVersion(
        filteredMessages.map((feedbackMessage) => ({
          id: feedbackMessage.requestId,
          organizationId: feedbackMessage.organizationId,
        }))
      );

      if (bumpedVersions.error || !bumpedVersions.data) {
        return err(bumpedVersions.error);
      }
      const feedbackScoreResult = await this.scoreStore.putScoresIntoClickhouse(
        filteredMessages.map((feedbackMessage) => {
          return {
            requestId: feedbackMessage.requestId,
            organizationId: feedbackMessage.organizationId,
            provider:
              bumpedVersions.data.find(
                (bumpedVersion) =>
                  bumpedVersion.id === feedbackMessage.requestId
              )?.provider ?? "",
            version:
              bumpedVersions.data.find(
                (bumpedVersion) =>
                  bumpedVersion.id === feedbackMessage.requestId
              )?.version ?? 0,
            mappedScores: [
              {
                score_attribute_key: "helicone-score-feedback",
                score_attribute_type: "number",
                score_attribute_value: feedbackMessage.feedback ? 1 : 0,
              },
            ],
          };
        })
      );

      if (feedbackScoreResult.error) {
        console.error("Error upserting feedback:", feedbackScoreResult.error);
        return err(feedbackScoreResult.error);
      }
      return ok(null);
    } catch (error: any) {
      console.error("Error processing feedback message:", error.message);
      return err(error.message);
    }
  }

  public async handleFeedback(
    batchContext: {
      batchId: string;
      partition: number;
      lastOffset: string;
      messageCount: number;
    },
    feedbackMessages: HeliconeFeedbackMessage[]
  ): Promise<Result<null, string>> {
    console.log(`Handling feedback for batch ${batchContext.batchId}`);
    const start = performance.now();
    const result = await this.processFeedback(feedbackMessages);
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: "feedbackHandler",
      methodName: "handleFeedback",
      messageCount: batchContext.messageCount,
      message: "Feedback",
    });

    if (result.error) {
      Sentry.captureException(new Error(JSON.stringify(result.error)), {
        tags: {
          type: "HandleFeedbackError",
          topic: "helicone-scores-prod",
        },
        extra: {
          batchId: batchContext.batchId,
          partition: batchContext.partition,
          offset: batchContext.lastOffset,
          messageCount: batchContext.messageCount,
        },
      });

      console.error(
        `Error inserting logs: ${JSON.stringify(result.error)} for batch ${
          batchContext.batchId
        }`
      );

      const kafkaProducer = new KafkaProducer();
      const kafkaResult = await kafkaProducer.sendFeedbackMessage(
        feedbackMessages,
        "helicone-scores-prod"
      );

      if (kafkaResult.error) {
        Sentry.captureException(new Error(kafkaResult.error), {
          tags: {
            type: "KafkaError",
            topic: "helicone-scores-prod",
          },
          extra: {
            batchId: batchContext.batchId,
            partition: batchContext.partition,
            offset: batchContext.lastOffset,
            messageCount: batchContext.messageCount,
          },
        });
      }
      return err(result.error);
    }
    console.log("Successfully processed feedback messages");
    return ok(null);
  }
}
