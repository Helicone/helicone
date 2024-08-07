import { dataDogClient } from "../../lib/clients/DataDogClient";
import { KafkaProducer } from "../../lib/clients/KafkaProducer";
import {
  DBQueryTimer,
  FREQUENT_PRECENT_LOGGING,
} from "../../lib/db/DBQueryTimer";
import * as Sentry from "@sentry/node";
import { supabaseServer } from "../../lib/db/supabase";
import { HeliconeFeedbackMessage } from "../../lib/handlers/HandlerContext";
import { err, ok, Result } from "../../lib/shared/result";
import { ScoreManager } from "../score/ScoreManager";

export class FeedbackManager {
  private queryTimer: DBQueryTimer;
  constructor(queryTimer: DBQueryTimer | null = null) {
    this.queryTimer =
      queryTimer ??
      new DBQueryTimer({
        enabled: true,
        apiKey: process.env.DATADOG_API_KEY ?? "",
        endpoint: process.env.DATADOG_ENDPOINT ?? "",
      });
  }

  private async processFeedback(feedbackMessages: HeliconeFeedbackMessage[]) {
    try {
      await Promise.all(
        feedbackMessages.map(async (feedbackMessage) => {
          const feedbackResult = await this.queryTimer.withTiming(
            supabaseServer.client
              .from("feedback")
              .upsert(
                {
                  response_id: feedbackMessage.responseId,
                  rating: feedbackMessage.feedback,
                  created_at: new Date().toISOString(),
                },
                { onConflict: "response_id" }
              )
              .select("*")
              .single(),
            {
              queryName: "upsert_feedback_by_response_id",
              percentLogging: FREQUENT_PRECENT_LOGGING,
            }
          );

          if (feedbackResult.error) {
            console.error("Error upserting feedback:", feedbackResult.error);
            return err(feedbackResult.error.message);
          }

          const scoreManager = new ScoreManager({
            organizationId: feedbackMessage.organizationId,
          });
          const feedbackScoreResult = await scoreManager.addScoresToClickhouse(
            feedbackMessage.requestId,
            [
              {
                score_attribute_key: "helicone-score-feedback",
                score_attribute_type: "number",
                score_attribute_value: feedbackMessage.feedback ? 1 : 0,
              },
            ]
          );

          if (feedbackScoreResult.error) {
            console.error(
              "Error upserting feedback:",
              feedbackScoreResult.error
            );
            return err(feedbackScoreResult.error);
          }
        })
      );
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
