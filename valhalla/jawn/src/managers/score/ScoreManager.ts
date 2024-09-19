import { err, ok, Result } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../lib/db/supabase";
import { BatchScores, Score, ScoreStore } from "../../lib/stores/ScoreStore";
import { dataDogClient } from "../../lib/clients/DataDogClient";
import { KafkaProducer } from "../../lib/clients/KafkaProducer";
import { HeliconeScoresMessage } from "../../lib/handlers/HandlerContext";
import * as Sentry from "@sentry/node";
import { validate as uuidValidate } from "uuid";

type Scores = Record<string, number | boolean>;

export interface ScoreRequest {
  scores: Scores;
}

export class ScoreManager extends BaseManager {
  private scoreStore: ScoreStore;
  private kafkaProducer: KafkaProducer;
  constructor(authParams: AuthParams) {
    super(authParams);
    this.scoreStore = new ScoreStore(authParams.organizationId);
    this.kafkaProducer = new KafkaProducer();
  }
  public async addScores(
    requestId: string,
    scores: Scores
  ): Promise<Result<null, string>> {
    const mappedScores = this.mapScores(scores);
    await this.scoreStore.putScoresIntoSupabase(requestId, mappedScores);
    const res = await this.addBatchScores([
      {
        requestId,
        scores: mappedScores,
        organizationId: this.authParams.organizationId,
        createdAt: new Date(),
      },
    ]);
    if (res.error) {
      return err(`Error adding scores: ${res.error}`);
    }
    return ok(null);
  }

  public async addBatchScores(
    scoresMessage: HeliconeScoresMessage[]
  ): Promise<Result<null, string>> {
    if (!this.kafkaProducer.isKafkaEnabled()) {
      console.log("Kafka is not enabled. Using score manager");
      const scoreManager = new ScoreManager({
        organizationId: this.authParams.organizationId,
      });
      return await scoreManager.handleScores(
        {
          batchId: "",
          partition: 0,
          lastOffset: "",
          messageCount: 1,
        },
        scoresMessage
      );
    }
    console.log("Sending scores message to Kafka");

    const res = await this.kafkaProducer.sendScoresMessage(
      scoresMessage,
      "helicone-scores-prod"
    );

    if (res.error) {
      console.error(`Error sending scores message to Kafka: ${res.error}`);
      return err(res.error);
    }
    return ok(null);
  }

  private async procesScores(
    scoresMessages: HeliconeScoresMessage[]
  ): Promise<Result<null, string>> {
    try {
      if (scoresMessages.length === 0) {
        return ok(null);
      }
      const validScoresMessages = scoresMessages.filter((message) =>
        uuidValidate(message.requestId)
      );
      // Filter out duplicate scores messages and only keep the latest one
      const filteredMessages = Array.from(
        validScoresMessages
          .reduce((map, message) => {
            const key = `${message.requestId}-${message.organizationId}`;
            const existingMessage = map.get(key);
            if (
              !existingMessage ||
              existingMessage.createdAt < message.createdAt
            ) {
              map.set(key, message);
            }
            return map;
          }, new Map<string, HeliconeScoresMessage>())
          .values()
      );
      const bumpedVersions = await this.scoreStore.bumpRequestVersion(
        filteredMessages.map((scoresMessage) => ({
          id: scoresMessage.requestId,
          organizationId: scoresMessage.organizationId,
        }))
      );

      if (
        bumpedVersions.error ||
        !bumpedVersions.data ||
        bumpedVersions.data.length === 0
      ) {
        return err(bumpedVersions.error);
      }
      const scoresScoreResult = await this.scoreStore.putScoresIntoClickhouse(
        bumpedVersions.data.map((scoresMessage) => {
          return {
            requestId: scoresMessage.id,
            organizationId: scoresMessage.helicone_org_id,
            provider: scoresMessage.provider,
            mappedScores:
              filteredMessages
                .find((x) => x.requestId === scoresMessage.id)
                ?.scores.map((score) => {
                  if (score.score_attribute_type === "boolean") {
                    return {
                      ...score,
                      score_attribute_key: `${score.score_attribute_key}-hcone-bool`,
                    };
                  }
                  return score;
                }) ?? [],
          };
        })
      );

      if (
        scoresScoreResult.error ||
        !scoresScoreResult.data ||
        scoresScoreResult.data.length === 0
      ) {
        console.error("Error upserting scores:", scoresScoreResult.error);
        return err(scoresScoreResult.error);
      }

      const feedbackResult = await this.scoreStore.bulkUpsertFeedback(
        scoresScoreResult.data
          .filter(
            (requestResponseRow) =>
              "helicone-score-feedback" in requestResponseRow.scores &&
              requestResponseRow.response_id !== null
          )
          .map((requestResponseRow) => ({
            responseId: requestResponseRow.response_id!,
            rating: Boolean(
              requestResponseRow.scores["helicone-score-feedback"]
            ),
          }))
      );
      if (feedbackResult.error) {
        console.error("Error upserting feedback:", feedbackResult.error);
        return err(feedbackResult.error);
      }
      return ok(null);
    } catch (error: any) {
      console.error("Error processing scores message:", error.message);
      return err(error.message);
    }
  }

  public async handleScores(
    batchContext: {
      batchId: string;
      partition: number;
      lastOffset: string;
      messageCount: number;
    },
    scoresMessages: HeliconeScoresMessage[]
  ): Promise<Result<null, string>> {
    console.log(`Handling scores for batch ${batchContext.batchId}`);
    const start = performance.now();
    const result = await this.procesScores(scoresMessages);
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: "scoresHandler",
      methodName: "handlescores",
      messageCount: batchContext.messageCount,
      message: "scores",
    });

    if (result.error) {
      Sentry.captureException(new Error(JSON.stringify(result.error)), {
        tags: {
          type: "HandlescoresError",
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
        `Error inserting scores: ${JSON.stringify(result.error)} for batch ${
          batchContext.batchId
        }`
      );

      const kafkaProducer = new KafkaProducer();
      const kafkaResult = await kafkaProducer.sendScoresMessage(
        scoresMessages,
        "helicone-scores-prod-dlq"
      );

      if (kafkaResult.error) {
        Sentry.captureException(new Error(kafkaResult.error), {
          tags: {
            type: "KafkaError",
            topic: "helicone-scores-prod-dlq",
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
    console.log("Successfully processed scores messages");
    return ok(null);
  }

  private mapScores(scores: Scores): Score[] {
    return Object.entries(scores).map(([key, value]) => {
      return {
        score_attribute_key: key,
        score_attribute_type: typeof value === "boolean" ? "boolean" : "number",
        score_attribute_value:
          typeof value === "boolean" ? (value ? 1 : 0) : value,
      };
    });
  }
}
