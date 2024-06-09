import {
  DataIsBeautifulRequestBody,
  ModelBreakdown,
} from "../controllers/public/dataIsBeautifulController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { Result, ok } from "../lib/shared/result";

export class DataIsBeautifulManager {
  async getModelBreakdown(
    filters: DataIsBeautifulRequestBody
  ): Promise<Result<ModelBreakdown[], string>> {
    const timeCondition = this.getTimeCondition(filters.timespan);
    const modelCondition = this.getModelCondition(filters.model);
    const providerCondition = this.getProviderCondition(filters.provider);

    const query = `
    SELECT
      model,
      COUNT(*) * 100.0 / (SELECT COUNT(*) FROM request_response_versioned WHERE status = '200' ${timeCondition}) AS percent
    FROM request_response_versioned
    WHERE status = '200'
      ${timeCondition}
      ${modelCondition}
      ${providerCondition}
    GROUP BY model
    ORDER BY percent DESC;
    `;

    const result = await clickhouseDb.dbQuery<ModelBreakdown>(query, []);
    console.log("result", JSON.stringify(result));

    if (result.error) {
      return result;
    }

    return ok(result.data ?? []);
  }

  getTimeCondition(timeSpan: string): string {
    switch (timeSpan) {
      case "1m":
        return "AND request_created_at >= now() - interval 1 month";
      case "3m":
        return "AND request_created_at >= now() - interval 3 month";
      case "6m":
        return "AND request_created_at >= now() - interval 6 month";
      case "all":
      default:
        return "";
    }
  }

  getModelCondition(model?: string): string {
    return model ? `AND model = '${model}'` : "";
  }

  getProviderCondition(provider?: string): string {
    return provider ? `AND provider = '${provider}'` : "";
  }
}
