import {
  DataIsBeautifulRequestBody,
  ModelBreakdown,
  ModelElement,
  ModelName,
  ProviderName,
  modelNames,
} from "../controllers/public/dataIsBeautifulController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { Result, ok } from "../lib/shared/result";

export class DataIsBeautifulManager {
  async getModelBreakdown(
    filters: DataIsBeautifulRequestBody
  ): Promise<Result<ModelBreakdown[], string>> {
    const timeCondition = this.getTimeCondition(filters.timespan);
    const filteredModels = this.filterModelNames(
      filters.models,
      filters.provider
    );
    const { caseStatements, whereCondition } =
      this.buildCaseStatementsAndWhereCondition(filteredModels);
    const providerCondition = this.getProviderCondition(filters.provider);

    const query = `
    WITH total_count AS (
      SELECT COUNT(*) AS total
      FROM request_response_versioned
      WHERE status = '200'
        ${timeCondition}
        ${providerCondition}
    )
    SELECT
      ${
        caseStatements
          ? `
      CASE
        ${caseStatements}
        ELSE 'Other'
      END AS matched_model`
          : "model AS matched_model"
      },
      COUNT(*) * 100.0 / total_count.total AS percent
    FROM request_response_versioned, total_count
    WHERE status = '200'
      ${timeCondition}
      ${providerCondition}
      ${whereCondition ? `AND ${whereCondition}` : ""}
    GROUP BY ${caseStatements ? "matched_model" : "model"}, total_count.total
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

  filterModelNames(
    models: ModelName[] | undefined,
    provider: ProviderName | undefined
  ): ModelElement[] {
    return modelNames.filter(
      (model) =>
        (!models || models.includes(model.model)) &&
        (!provider || model.provider === provider)
    );
  }

  buildCaseStatementsAndWhereCondition(filteredModels: ModelElement[]) {
    const caseStatements = filteredModels
      .map((model) =>
        model.variations
          .map(
            (variation) =>
              `WHEN model LIKE '%${variation}%' THEN '${model.model}'`
          )
          .join(" ")
      )
      .join(" ");

    const whereCondition = filteredModels
      .flatMap((model) =>
        model.variations.map((variation) => `model LIKE '%${variation}%'`)
      )
      .join(" OR ");

    return { caseStatements, whereCondition: `(${whereCondition})` };
  }

  getModelCondition(models?: ModelName[], provider?: string): string {
    const filteredModels = provider
      ? modelNames.filter((model) => model.provider === provider)
      : modelNames;

    const modelsToUse =
      models && models.length > 0
        ? filteredModels.filter((model) => models.includes(model.model))
        : filteredModels;

    return modelsToUse.length > 0
      ? `AND (${modelsToUse
          .flatMap((model) => model.variations)
          .map((variation) => `model = '${variation}'`)
          .join(" OR ")})`
      : "";
  }

  getProviderCondition(provider?: string): string {
    return provider ? `AND provider = '${provider}'` : "";
  }
}
