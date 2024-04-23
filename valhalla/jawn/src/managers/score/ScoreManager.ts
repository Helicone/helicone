import { supabaseServer } from "../../lib/db/supabase";
import { err, Result } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";

export class ScoreManager extends BaseManager {
  public async addScores(
    requestId: string,
    heliconeAuth: string,
    scores: Record<string, number>
  ): Promise<Result<string, string>> {
    try {
      const apiKey = await supabaseServer.client
        .from("helicone_api_keys")
        .select("*")
        .eq("api_key_hash", heliconeAuth);

      if (apiKey.error) {
        return err(JSON.stringify(apiKey.error));
      }
      if (apiKey.data.length === 0) {
        return err("No API key found");
      }

      const scorePromises = Object.entries(scores).map(
        async ([attribute, value]) => {
          let scoreAttribute = await supabaseServer.client
            .from("score_attribute")
            .select("*")
            .eq("score_key", attribute)
            .eq("organization", apiKey.data[0].organization_id)
            .single();

          if (!scoreAttribute.data) {
            scoreAttribute = await supabaseServer.client
              .from("score_attribute")
              .insert([
                {
                  score_key: attribute,
                  organization: apiKey.data[0].organization_id,
                },
              ])
              .select("*")
              .single();
          }

          if (scoreAttribute.error) {
            return err(scoreAttribute.error.message);
          }

          const scoreValue = await supabaseServer.client
            .from("score_value")
            .insert({
              score_attribute: scoreAttribute.data.id,
              request_id: requestId,
              int_value: value,
            });

          if (scoreValue.error) {
            return err(scoreValue.error.message);
          }

          console.log(scoreValue.data);
        }
      );

      await Promise.allSettled(scorePromises);
      return { data: "Scores added successfully", error: null };
    } catch (error: any) {
      return err(error.message);
    }
  }
}
