import { err, ok, Result } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../lib/db/supabase";
import { BatchScores, Score, ScoreStore } from "../../lib/stores/ScoreStore";
import { dataDogClient } from "../../lib/clients/DataDogClient";
import { KafkaProducer } from "../../lib/clients/KafkaProducer";
import { HeliconeScoresMessage } from "../../lib/handlers/HandlerContext";
import * as Sentry from "@sentry/node";

type Scores = Record<string, number | boolean>;

export interface ScoreRequest {
  scores: Scores;
}

export class ScoreManager extends BaseManager {
  private scoreStore: ScoreStore;
  constructor(authParams: AuthParams) {
    super(authParams);
    this.scoreStore = new ScoreStore(authParams.organizationId);
  }
  public async addScores(
    requestId: string,
    scores: Scores
  ): Promise<Result<string, string>> {
    const res = await this.addScoresToRequest(requestId, scores);
    if (res.error || !res.data) {
      return err(`Error adding scores: ${res.error}`);
    }
    return ok(res.data);
  }

  private async addScoresToRequest(
    requestId: string,
    scores: Scores
  ): Promise<Result<string, string>> {
    try {
      const mappedScores = this.mapScores(scores);
      const supabaseRequest = await this.scoreStore.putScoresIntoSupabase(
        requestId,
        mappedScores
      );

      if (supabaseRequest.error || !supabaseRequest.data) {
        return err(supabaseRequest.error);
      }

      const requestInClickhouse = await this.addScoresToClickhouse(
        requestId,
        mappedScores
      );

      if (requestInClickhouse.error || !requestInClickhouse.data) {
        return requestInClickhouse;
      }

      return { data: "Scores added to Clickhouse successfully", error: null };
    } catch (error: any) {
      return err(error.message);
    }
  }

  public async addScoresToClickhouse(
    requestId: string,
    mappedScores: Score[]
  ): Promise<Result<string, string>> {
    try {
      const request = await this.scoreStore.bumpRequestVersion([
        {
          id: requestId,
          organizationId: this.authParams.organizationId,
        },
      ]);

      if (request.error || !request.data) {
        return err(request.error);
      }

      if (request.data.length === 0) {
        return err(`Request not found: ${requestId}`);
      }

      const requestInClickhouse = await this.scoreStore.putScoresIntoClickhouse(
        [
          {
            requestId: request.data[0].id,
            organizationId: this.authParams.organizationId,
            provider: request.data[0].provider,
            version: request.data[0].version,
            mappedScores,
          },
        ]
      );

      if (requestInClickhouse.error || !requestInClickhouse.data) {
        return requestInClickhouse;
      }
      return { data: "Scores added to Clickhouse successfully", error: null };
    } catch {
      return err("Error adding scores to Clickhouse");
    }
  }

  private async procesScores(scoresMessages: HeliconeScoresMessage[]) {
    try {
      // Filter out duplicate scores messages and only keep the latest one
      const filteredMessages = Array.from(
        scoresMessages
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

      if (bumpedVersions.error || !bumpedVersions.data) {
        return err(bumpedVersions.error);
      }
      const scoresScoreResult = await this.scoreStore.putScoresIntoClickhouse(
        bumpedVersions.data.map((scoresMessage) => {
          return {
            requestId: scoresMessage.id,
            organizationId: scoresMessage.helicone_org_id,
            provider: scoresMessage.provider,
            version: scoresMessage.version,
            mappedScores:
              filteredMessages.find((x) => x.requestId === scoresMessage.id)
                ?.scores ?? [],
          };
        })
      );

      if (scoresScoreResult.error) {
        console.error("Error upserting scores:", scoresScoreResult.error);
        return err(scoresScoreResult.error);
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

      // const kafkaProducer = new KafkaProducer();
      // const kafkaResult = await kafkaProducer.sendScoresMessage(
      //   scoresMessages,
      //   "helicone-scores-prod"
      // );

      // if (kafkaResult.error) {
      //   Sentry.captureException(new Error(kafkaResult.error), {
      //     tags: {
      //       type: "KafkaError",
      //       topic: "helicone-scores-prod",
      //     },
      //     extra: {
      //       batchId: batchContext.batchId,
      //       partition: batchContext.partition,
      //       offset: batchContext.lastOffset,
      //       messageCount: batchContext.messageCount,
      //     },
      //   });
      // }
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
