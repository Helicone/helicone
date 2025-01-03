import { EvalQueryParams } from "../../controllers/public/evalController";
import { AuthParams } from "../../lib/db/supabase";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";
import { Result, err, ok, resultMap } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";

export type TimeIncrement = "min" | "hour" | "day" | "week" | "month" | "year";

function convertDbIncrement(dbIncrement: TimeIncrement): string {
  return dbIncrement === "min" ? "MINUTE" : dbIncrement;
}

function buildDateTrunc(
  dbIncrement: TimeIncrement,
  timeZoneDifference: number,
  column: string
): string {
  return `DATE_TRUNC('${convertDbIncrement(dbIncrement)}', ${column} ${
    timeZoneDifference > 0
      ? `- INTERVAL '${Math.abs(timeZoneDifference)} minute'`
      : `+ INTERVAL '${timeZoneDifference} minute'`
  }, 'UTC')`;
}

export interface Eval {
  name: string;
  averageScore: number;
  minScore: number;
  maxScore: number;
  count: number;
  overTime: { date: string; count: number }[];
  averageOverTime: { date: string; value: number }[];
}

export interface ScoreDistribution {
  name: string;
  distribution: { lower: number; upper: number; value: number }[];
}

export class EvalManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  public async getEvals(
    evalQueryParams: EvalQueryParams
  ): Promise<Result<Eval[], string>> {
    const timeFilter: FilterNode = {
      left: {
        request_response_rmt: {
          request_created_at: {
            gte: new Date(evalQueryParams.timeFilter.start),
          },
        },
      },
      operator: "and",
      right: {
        request_response_rmt: {
          request_created_at: {
            lt: new Date(evalQueryParams.timeFilter.end),
          },
        },
      },
    };

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      argsAcc: [],
      filter: {
        left: evalQueryParams.filter,
        operator: "and",
        right: timeFilter,
      },
    });

    const query = `
      SELECT
        avgMap(scores) AS average_score,
        minMap(scores) AS min_score,
        maxMap(scores) AS max_score,
        countMap(scores) AS count_score,
        ${buildDateTrunc("hour", 0, "request_created_at")} as created_at_trunc
      FROM request_response_rmt
      WHERE (
        ${builtFilter.filter}
      )
      GROUP BY created_at_trunc
      ORDER BY created_at_trunc ASC
    `;

    const result = await dbQueryClickhouse<{
      average_score: Record<string, number>;
      min_score: Record<string, number>;
      max_score: Record<string, number>;
      count_score: Record<string, number>;
      created_at_trunc: string;
    }>(query, builtFilter.argsAcc);

    return resultMap(result, (rows) => {
      const evalMap = new Map<string, Eval>();

      rows.forEach((row) => {
        Object.keys(row.average_score).forEach((scoreName) => {
          if (!evalMap.has(scoreName)) {
            evalMap.set(scoreName, {
              name: scoreName,
              averageScore: 0,
              minScore: Infinity,
              maxScore: -Infinity,
              count: 0,
              overTime: [],
              averageOverTime: [],
            });
          }

          const evalItem = evalMap.get(scoreName)!;
          evalItem.averageScore = row.average_score[scoreName];
          evalItem.minScore = Math.min(
            evalItem.minScore,
            row.min_score[scoreName]
          );
          evalItem.maxScore = Math.max(
            evalItem.maxScore,
            row.max_score[scoreName]
          );
          evalItem.count += +row.count_score[scoreName];
          evalItem.overTime.push({
            date: row.created_at_trunc,
            count: row.count_score[scoreName],
          });
          evalItem.averageOverTime.push({
            date: row.created_at_trunc,
            value: row.average_score[scoreName],
          });
        });
      });

      return Array.from(evalMap.values());
    });
  }

  public async getEvalScores(): Promise<Result<string[], string>> {
    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      argsAcc: [],
      filter: "all",
    });

    const query = `
      SELECT DISTINCT arrayJoin(mapKeys(scores)) AS score
      FROM request_response_rmt
      WHERE (
        ${builtFilter.filter}
      )
    `;
    const result = await dbQueryClickhouse<{ score: string }>(
      query,
      builtFilter.argsAcc
    );

    return resultMap(result, (r) => r.map((r) => r.score));
  }

  public async addEval(
    requestId: string,
    evalData: { name: string; score: number }
  ): Promise<Result<null, string>> {
    // Implement the logic to add an eval to the database
    // This is a placeholder implementation
    console.log(`Adding eval for request ${requestId}:`, evalData);
    return ok(null);
  }

  public async getScoreDistributions(
    evalQueryParams: EvalQueryParams
  ): Promise<Result<ScoreDistribution[], string>> {
    const timeFilter: FilterNode = {
      left: {
        request_response_rmt: {
          request_created_at: {
            gte: new Date(evalQueryParams.timeFilter.start),
          },
        },
      },
      operator: "and",
      right: {
        request_response_rmt: {
          request_created_at: {
            lt: new Date(evalQueryParams.timeFilter.end),
          },
        },
      },
    };

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      argsAcc: [],
      filter: {
        left: evalQueryParams.filter,
        operator: "and",
        right: timeFilter,
      },
    });

    const query = `
      SELECT
        score_name,
        histogram(10)(score_value) as distribution
      FROM (
        SELECT
          arrayJoin(mapKeys(scores)) as score_name,
          mapValues(scores)[indexOf(mapKeys(scores), score_name)] as score_value
        FROM request_response_rmt
        WHERE (
          ${builtFilter.filter}
        )
      )
      GROUP BY score_name
    `;

    const result = await dbQueryClickhouse<{
      score_name: string;
      distribution: [number, number, number][];
    }>(query, builtFilter.argsAcc);

    return resultMap(result, (rows) =>
      rows.map((row) => ({
        name: row.score_name,
        distribution: row.distribution.map((d) => ({
          lower: d[0],
          upper: d[1],
          value: d[2],
        })),
      }))
    );
  }
}
