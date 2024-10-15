import {
  DataIsBeautifulRequestBody,
  ModelBreakdown,
  ModelBreakdownOverTime,
  ModelCost,
  ModelElement,
  ModelName,
  ModelUsageOverTime,
  ProviderBreakdown,
  OpenStatsProviderName,
  ProviderUsageOverTime,
  TTFTvsPromptLength,
  TimeSpan,
  TotalValuesForAllOfTime,
  allModelVariations,
  allProviders,
  modelNames,
} from "../controllers/public/dataIsBeautifulController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { Result, err, ok } from "../lib/shared/result";
import { clickhousePriceCalc } from "../packages/cost";

function andCondition(...conditions: string[]): string {
  return conditions.filter(Boolean).join(" AND ");
}
// Always just gives 2 decimal places of accuracy.
// ex: 24893629 -> 25000000
// ex: 398 -> 400
// ex: 234 ->230
function bigNumberRound(num: number): number {
  if (num === 0) {
    return 0;
  } else {
    const d = Math.ceil(Math.log10(num < 0 ? -num : num));
    const power = 2 - d;
    const magnitude = Math.pow(10, power);
    const shifted = Math.round(num * magnitude);
    return shifted / magnitude;
  }
}

export class DataIsBeautifulManager {
  async getTotalRequests(
    filters: DataIsBeautifulRequestBody
  ): Promise<Result<number, string>> {
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
      COUNT(*) AS total
    FROM request_response_rmt
    WHERE ${andCondition(timeCondition, providerCondition, whereCondition)}
    `;
    const result = await clickhouseDb.dbQuery<{ total: number }>(query, []);
    if (result.error) {
      return result;
    }
    return ok(bigNumberRound(result.data?.[0]?.total ?? 0));
  }

  async getProviderPercentage(
    filters: DataIsBeautifulRequestBody
  ): Promise<Result<ProviderBreakdown[], string>> {
    const timeCondition = this.getTimeCondition(filters.timespan);

    const query = `
    WITH total_count AS (
      SELECT COUNT(*) AS total
      FROM request_response_rmt
      WHERE status = '200'
        AND ${timeCondition}
    )
    SELECT
      provider AS provider,
      COUNT(*) * 100.0 / total_count.total AS percent
    FROM request_response_rmt, total_count
    WHERE status = '200'
      AND ${timeCondition}
      AND provider IN (${(
        Array.from(
          new Set(modelNames.map((model) => model.provider))
        ) as OpenStatsProviderName[]
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
    const costCalculation = clickhousePriceCalc("request_response_rmt");

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
      FROM request_response_rmt rrv
      WHERE 
        ${andCondition(
          "status = '200'",
          timeCondition,
          providerCondition,
          whereCondition
        )}
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
  FROM request_response_rmt
  WHERE 
    ${andCondition(
      "status = '200'",
      timeCondition,
      providerCondition,
      whereCondition
    )}
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
    FROM request_response_rmt
    WHERE status = 200 -- Include only successful requests
        AND prompt_tokens IS NOT NULL
        AND completion_tokens IS NOT NULL
        AND completion_tokens > 0
        AND prompt_tokens > 0
        AND time_to_first_token > 0
        AND ${andCondition(
          timeCondition,
          providerCondition,
          whereCondition,
          "true"
        )}
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
      FROM request_response_rmt
      WHERE 
        ${andCondition("status = '200'", timeCondition, providerCondition)}
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
    FROM request_response_rmt, total_count
    WHERE 
      ${andCondition(
        "status = '200'",
        timeCondition,
        providerCondition,
        whereCondition
      )}
    GROUP BY ${caseStatements ? "matched_model" : "model"}, total_count.total
    ORDER BY percent DESC;
    `;

    const result = await clickhouseDb.dbQuery<ModelBreakdown>(query, []);

    if (result.error) {
      return result;
    }

    return ok(result.data ?? []);
  }

  async providerUsageOverTime(): Promise<
    Result<ProviderUsageOverTime[], string>
  > {
    const query = `
    SELECT
      CASE
        ${allProviders
          .map(
            (provider) =>
              `WHEN provider LIKE '%${provider}%' THEN '${provider}'`
          )
          .join(" ")}
        ELSE 'Other'
      END AS provider,
      formatDateTime(request_created_at, '%Y-%m-%d') AS date,
      SUM(completion_tokens) + SUM(prompt_tokens) AS tokens
    FROM request_response_rmt
    WHERE prompt_tokens IS NOT NULL
    AND status = 200
    AND completion_tokens IS NOT NULL
    AND prompt_tokens > 0
    AND completion_tokens > 0
    AND model is not null
    AND request_created_at >= now() - interval 1 month 
    AND request_created_at < now()
    GROUP BY provider, date
    ORDER BY provider, date
    `;

    const result = await clickhouseDb.dbQuery<ProviderUsageOverTime>(query, []);

    if (result.error) {
      return result;
    }

    return ok(result.data?.map((d) => ({ ...d, tokens: +d.tokens })) ?? []);
  }

  async getModelUsageOverTime(): Promise<Result<ModelUsageOverTime[], string>> {
    const query = `
    SELECT
      CASE
        ${allModelVariations
          .map((model) => `WHEN model LIKE '%${model}%' THEN '${model}'`)
          .join(" ")}
        ELSE 'Other'
      END AS model,
      formatDateTime(request_created_at, '%Y-%m-%d') AS date,
      SUM(completion_tokens) + SUM(prompt_tokens) AS tokens
    FROM request_response_rmt
    WHERE prompt_tokens IS NOT NULL
    AND status = 200
    AND completion_tokens IS NOT NULL
    AND prompt_tokens > 0
    AND completion_tokens > 0
    AND model is not null
    AND request_created_at >= now() - interval 1 month 
    AND request_created_at < now()
    GROUP BY model, date
    ORDER BY model, date
    `;

    const result = await clickhouseDb.dbQuery<ModelUsageOverTime>(query, []);

    if (result.error) {
      return result;
    }

    return ok(result.data?.map((d) => ({ ...d, tokens: +d.tokens })) ?? []);
  }

  private async getTotalCost(): Promise<number> {
    const costQuery = clickhousePriceCalc("request_response_rmt");
    const query = `
    SELECT
      ${costQuery} AS total_cost
    FROM request_response_rmt
    WHERE status = 200
    `;

    const result = await clickhouseDb.dbQuery<{ total_cost: number }>(
      query,
      []
    );
    if (!result.data?.[0]?.total_cost) {
      return 5_700_000;
    }

    return result.data?.[0]?.total_cost;
  }

  async getTotalValues(): Promise<Result<TotalValuesForAllOfTime, string>> {
    const query = `
    SELECT
      COUNT(*) AS total_requests,
      SUM(completion_tokens) + SUM(prompt_tokens) AS total_tokens
    FROM request_response_rmt 
    `;

    const result = await clickhouseDb.dbQuery<{
      total_requests: number;
      total_tokens: number;
    }>(query, []);

    if (result.error) {
      return result;
    }

    return ok({
      total_requests: result.data?.[0].total_requests ?? 0,
      total_tokens: result.data?.[0].total_tokens ?? 0,
      total_cost: await this.getTotalCost(),
    });
  }

  getTimeCondition(timeSpan?: TimeSpan): string {
    switch (timeSpan) {
      case "1m":
        return "request_created_at >= now() - interval 1 month AND request_created_at < now()";
      case "7d":
        return "request_created_at >= now() - interval 7 day AND request_created_at < now()";
      case "3m":
        return "request_created_at >= now() - interval 3 month AND request_created_at < now()";
      default:
        return "";
    }
  }

  filterModelNames(
    models: ModelName[] | undefined,
    provider: OpenStatsProviderName | undefined
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

  getProviderCondition(providers?: OpenStatsProviderName[]): string {
    if (!providers || providers.length === 0) return "";
    const providerList = providers
      .map((provider) => `'${provider}'`)
      .join(", ");
    return `provider IN (${providerList})`;
  }
}
