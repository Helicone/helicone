import { err, ok, Result } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../lib/db/supabase";
import { ScoreStore } from "../../lib/stores/ScoreStore";

export class ScoreManager extends BaseManager {
  private scoreStore: ScoreStore;
  constructor(authParams: AuthParams) {
    super(authParams);
    this.scoreStore = new ScoreStore(authParams.organizationId);
  }
  public async addScores(
    requestId: string,
    scores: Record<string, number>
  ): Promise<Result<string, string>> {
    const res = await this.addScoresToRequest(requestId, scores);
    if (res.error || !res.data) {
      return err(`Error adding scores: ${res.error}`);
    }
    return ok(res.data);
  }

  private async addScoresToRequest(
    requestId: string,
    scores: Record<string, number>
  ): Promise<Result<string, string>> {
    try {
      const supabaseRequest = await this.scoreStore.putScoresIntoSupabase(
        requestId,
        scores
      );

      if (supabaseRequest.error || !supabaseRequest.data) {
        return err(supabaseRequest.error);
      }

      const request = await this.scoreStore.bumpRequestVersion(requestId);

      if (request.error || !request.data) {
        return err(request.error);
      }

      const requestInClickhouse = await this.scoreStore.putScoresIntoClickhouse(
        {
          ...request.data[0],
          scores: scores,
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
}
