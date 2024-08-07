import { dataDogClient } from "../../lib/clients/DataDogClient";
import { KafkaProducer } from "../../lib/clients/KafkaProducer";
import {
  DBQueryTimer,
  FREQUENT_PRECENT_LOGGING,
} from "../../lib/db/DBQueryTimer";
import * as Sentry from "@sentry/node";
import { supabaseServer } from "../../lib/db/supabase";
import { HeliconeFeedbackMessage } from "../../lib/handlers/HandlerContext";
import { dbExecute } from "../../lib/shared/db/dbExecute";
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
          const requestResponse = await this.waitForRequestAndResponse(
            feedbackMessage.requestId,
            feedbackMessage.organizationId
          );

          if (requestResponse.error || !requestResponse.data) {
            return err("Request not found");
          }

          const feedbackResult = await this.queryTimer.withTiming(
            supabaseServer.client
              .from("feedback")
              .upsert(
                {
                  response_id: requestResponse.data.responseId,
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
          topic: "helicone-feedback-prod-dlq",
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
        "helicone-feedback-prod-dlq"
      );

      if (kafkaResult.error) {
        Sentry.captureException(new Error(kafkaResult.error), {
          tags: {
            type: "KafkaError",
            topic: "helicone-feedback-prod-dlq",
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
    return ok(null);
  }

  private async waitForRequestAndResponse(
    heliconeId: string,
    organizationId: string
  ): Promise<
    Result<
      {
        requestId: string;
        responseId: string;
      },
      string
    >
  > {
    const maxRetries = 3;

    let sleepDuration = 30_000; // 30 seconds
    for (let i = 0; i < maxRetries; i++) {
      const { data: response, error: responseError } = await dbExecute<{
        request: string;
        response: string;
      }>(
        `
        SELECT
          request.id as request,
          response.id as response
        FROM request inner join response on request.id = response.request
        WHERE request.helicone_org_id = $1
        AND request.id = $2
        `,
        [organizationId, heliconeId]
      );

      if (responseError) {
        console.error("Error fetching response:", responseError);
        return err(responseError);
      }

      if (response && response.length > 0) {
        return ok({
          requestId: response[0].request,
          responseId: response[0].response,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, sleepDuration));
      sleepDuration *= 2.5; // 30s, 75s, 187.5s
    }

    return { error: "Request not found.", data: null };
  }
}
