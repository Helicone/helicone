import { err, ok, Result } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../lib/db/supabase";
import { Score, ScoreStore } from "../../lib/stores/ScoreStore";

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

      const request = await this.scoreStore.bumpRequestVersion(requestId);

      if (request.error || !request.data) {
        return err(request.error);
      }

      if (request.data.length === 0) {
        return err(`Request not found: ${requestId}`);
      }

      const requestInClickhouse = await this.scoreStore.putScoresIntoClickhouse(
        {
          ...request.data[0],
          scores: mappedScores,
        }
      );

      if (requestInClickhouse.error || !requestInClickhouse.data) {
        return requestInClickhouse;
      }

      return { data: "Scores added to Clickhouse successfully", error: null };
    } catch (error: any) {
      return err(error.message);
    }
  }

  public async addSignleScoreToClickhouse(
    requestId: string,
    mappedScores: Score
  ): Promise<Result<string, string>> {
    const request = await this.scoreStore.bumpRequestVersion(requestId);

    console.log("version bumped", request);

    if (request.error || !request.data) {
      return err(request.error);
    }

    if (request.data.length === 0) {
      return err(`Request not found: ${requestId}`);
    }

    const requestInClickhouse = await this.scoreStore.putScoreIntoClickhouse({
      ...request.data[0],
      score: mappedScores,
    });

    if (requestInClickhouse.error || !requestInClickhouse.data) {
      return requestInClickhouse;
    }
    return { data: "Scores added to Clickhouse successfully", error: null };
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
