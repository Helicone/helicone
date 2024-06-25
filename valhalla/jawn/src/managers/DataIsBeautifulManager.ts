import {
  DataIsBeautifulRequestBody,
  ModelBreakdown,
  ModelBreakdownOverTime,
  ModelCost,
  ModelElement,
  ModelName,
  ProviderBreakdown,
  ProviderName,
  TTFTvsPromptLength,
  TimeSpan,
  modelNames,
} from "../controllers/public/dataIsBeautifulController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { Result, err, ok } from "../lib/shared/result";
import { clickhousePriceCalc } from "../packages/cost";

export class DataIsBeautifulManager {
  async getProviderPercentage(
    filters: DataIsBeautifulRequestBody
  ): Promise<Result<ProviderBreakdown[], string>> {
    const timeCondition = this.getTimeCondition(filters.timespan);

    const query = `
    WITH total_count AS (
      SELECT COUNT(*) AS total
      FROM request_response_versioned
      WHERE status = '200'
        ${timeCondition}
    )
    SELECT
      provider AS provider,
      COUNT(*) * 100.0 / total_count.total AS percent
    FROM request_response_versioned, total_count
    WHERE status = '200'
      ${timeCondition}
      AND provider IN (${(
        Array.from(
          new Set(modelNames.map((model) => model.provider))
        ) as ProviderName[]
      )
        .map((provider) => `'${provider}'`)
        .join(", ")})
    GROUP BY provider, total_count.total
    ORDER BY percent DESC;
    `;

    const result = await clickhouseDb.dbQuery<ProviderBreakdown>(query, []);

    if (result.error) {
      return result;
    }

    return ok(result.data ?? []);
  }

  async getModelCost(
    filters: DataIsBeautifulRequestBody
  ): Promise<Result<ModelCost[], string>> {
    const timeCondition = this.getTimeCondition(filters.timespan);
    const filteredModels = this.filterModelNames(
      filters.models,
      filters.provider
    );
    const { caseStatements, whereCondition } =
      this.buildCaseStatementsAndWhereCondition(filteredModels);
    const providerCondition = this.getProviderCondition(
      filters.provider ? [filters.provider] : undefined
    );

    // Generate the cost calculation using the clickhousePriceCalc function
    const costCalculation = clickhousePriceCalc("request_response_versioned");

    const query = `
  WITH
    request_data AS (
      SELECT
        ${
          caseStatements
            ? `
          CASE
            ${caseStatements}
            ELSE 'Other'
          END`
            : "model"
        } AS matched_model,
        ${costCalculation} AS cost,
        model
      FROM request_response_versioned rrv
      WHERE status = '200'
        ${timeCondition}
        ${providerCondition}
        ${whereCondition ? `AND ${whereCondition}` : ""}
      GROUP BY model
    )
    SELECT
      matched_model,
      SUM(cost) AS cost
    FROM request_data
    GROUP BY matched_model
    ORDER BY matched_model
  `;

    const result = await clickhouseDb.dbQuery<
      ModelCost & {
        cost: number;
      }
    >(query, []);

    if (result.error) {
      return err(result.error);
    }

    const filteredResults = result.data?.filter(
      (modelCost) => modelCost.cost && modelCost.cost > 0
    );

    const totalCost =
      filteredResults?.reduce((acc, modelCost) => acc + modelCost.cost, 0) ?? 0;

    const costPercentage =
      filteredResults?.map((modelCost) => ({
        matched_model: modelCost.matched_model,
        percent: (modelCost.cost * 100) / totalCost,
      })) ?? [];

    return ok(costPercentage);
  }

  async getModelPercentageOverTime(
    filters: DataIsBeautifulRequestBody
  ): Promise<Result<ModelBreakdownOverTime[], string>> {
    const timeCondition = this.getTimeCondition(filters.timespan);
    const filteredModels = this.filterModelNames(
      filters.models,
      filters.provider
    );
    const { whereCondition, caseStatements } =
      this.buildCaseStatementsAndWhereCondition(filteredModels);
    const providerCondition = this.getProviderCondition(
      filters.provider ? [filters.provider] : undefined
    );

    const query = `
  SELECT
    formatDateTime(request_created_at, '%Y-%m-%d') AS day,
     ${
       caseStatements
         ? `
      CASE
        ${caseStatements}
        ELSE 'Other'
      END AS matched_model`
         : "model AS matched_model"
     },
     COUNT(*) AS count
  FROM request_response_versioned
  WHERE status = '200'
    ${timeCondition}
    ${providerCondition}
    ${whereCondition ? `AND ${whereCondition}` : ""}
  GROUP BY day, matched_model
  ORDER BY day, matched_model
    `;

    const result = await clickhouseDb.dbQuery<{
      day: string;
      matched_model: string;
      count: number;
    }>(query, []);

    if (result.error) {
      return result;
    }

    const modelCounts = result.data ?? [];

    const modelAsPercentage = modelCounts
      .map((modelCount) => {
        const totalForDay = modelCounts
          .filter((model) => model.day === modelCount.day)
          .reduce((acc, model) => acc + +model.count, 0);

        const percent = (modelCount.count * 100) / totalForDay;
        if (percent < 0.5) {
          return {
            date: modelCount.day,
            matched_model: "Other",
            percent: percent,
          };
        }
        return {
          date: modelCount.day,
          matched_model: modelCount.matched_model,
          percent,
        };
      })
      // group all others with the same date
      .reduce((acc, model) => {
        const existing = acc.find(
          (m) =>
            m.date === model.date && m.matched_model === model.matched_model
        );
        if (existing) {
          existing.percent += model.percent;
        } else {
          acc.push(model);
        }
        return acc;
      }, [] as ModelBreakdownOverTime[]);

    return ok(modelAsPercentage);
  }

  async getTTFTvsPromptInputLength(
    filters: DataIsBeautifulRequestBody
  ): Promise<Result<TTFTvsPromptLength[], string>> {
    const timeCondition = this.getTimeCondition(filters.timespan);
    const filteredModels = this.filterModelNames(
      filters.models,
      filters.provider
    );
    const { caseStatements, whereCondition } =
      this.buildCaseStatementsAndWhereCondition(filteredModels);
    const providerCondition = this.getProviderCondition(
      filters.provider ? [filters.provider] : undefined
    );

    const query = `
    SELECT
        AVG(time_to_first_token) AS ttft,
        quantile(0.99)(time_to_first_token) AS ttft_p99,
        quantile(0.75)(time_to_first_token) AS ttft_p75,
        AVG(time_to_first_token / completion_tokens) AS ttft_normalized,
        quantile(0.99)(time_to_first_token / completion_tokens) AS ttft_normalized_p99,
        quantile(0.75)(time_to_first_token / completion_tokens) AS ttft_normalized_p75,
        FLOOR(prompt_tokens / 100) * 100 AS prompt_length
    FROM request_response_versioned
    WHERE status = 200 -- Include only successful requests
        AND prompt_tokens IS NOT NULL
        AND completion_tokens IS NOT NULL
        AND completion_tokens > 0
        AND prompt_tokens > 0
        AND time_to_first_token > 0
        AND model ILIKE '%gpt-4%' 
        ${timeCondition}
        ${providerCondition}
        ${whereCondition ? `AND ${whereCondition}` : ""}
    GROUP BY
        prompt_length
    ORDER BY prompt_length ascending
    `;

    const result = await clickhouseDb.dbQuery<TTFTvsPromptLength>(query, []);

    if (result.error) {
      return result;
    }

    return ok(result.data ?? []);
  }

  async getModelPercentage(
    filters: DataIsBeautifulRequestBody
  ): Promise<Result<ModelBreakdown[], string>> {
    const timeCondition = this.getTimeCondition(filters.timespan);
    const filteredModels = this.filterModelNames(
      filters.models,
      filters.provider
    );
    const { caseStatements, whereCondition } =
      this.buildCaseStatementsAndWhereCondition(filteredModels);
    const providerCondition = this.getProviderCondition(
      filters.provider ? [filters.provider] : undefined
    );

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

    if (result.error) {
      return result;
    }

    return ok(result.data ?? []);
  }

  getTimeCondition(timeSpan?: TimeSpan): string {
    switch (timeSpan) {
      case "1m":
        return "AND request_created_at >= now() - interval 1 month AND request_created_at < now()";
      case "3m":
        return "AND request_created_at >= now() - interval 3 month AND request_created_at < now()";
      case "1yr":
        return "AND request_created_at >= now() - interval 12 month AND request_created_at < now()";
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

  getProviderCondition(providers?: ProviderName[]): string {
    if (!providers || providers.length === 0) return "";
    const providerList = providers
      .map((provider) => `'${provider}'`)
      .join(", ");
    return `AND provider IN (${providerList})`;
  }
}
