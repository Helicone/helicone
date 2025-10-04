import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { err, ok, Result } from "../../packages/common/result";

export type PSize = "p50" | "p75" | "p95" | "p99" | "p99.9";

export interface HistogramRow {
  range_start: string;
  range_end: string;
  value: number;
}

const SIZES_TO_PERCENTILES: Record<PSize, string> = {
  p50: "0.5",
  p75: "0.75",
  p95: "0.95",
  p99: "0.99",
  "p99.9": "0.999",
};

export async function getHistogramRowOnKeys({
  keys,
  pSize,
  useInterquartile,
  builtFilter,
  aggregateFunction,
}: {
  keys: KeyDefinition[];
  pSize: PSize;
  useInterquartile: boolean;
  builtFilter: Awaited<ReturnType<typeof buildFilterWithAuthClickHouse>>;
  aggregateFunction: string;
}): Promise<Result<HistogramRow[], string>> {
  const { filter, argsAcc } = builtFilter;
  const upperPercentile = SIZES_TO_PERCENTILES[pSize ?? "p75"];
  const lowerPercentile = useInterquartile
    ? (1 - parseFloat(upperPercentile)).toString()
    : upperPercentile;

  const buildPercentileClause = (metric: string) =>
    useInterquartile
      ? `quantile(${lowerPercentile})(${metric}) AS lower_bound,
         quantile(${upperPercentile})(${metric}) AS upper_bound`
      : `quantile(${upperPercentile})(${metric}) AS p_value`;

  const buildWhereClause = (metric: string) =>
    useInterquartile
      ? `${metric} BETWEEN lower_bound AND upper_bound`
      : `${metric} <= p_value`;

  const keySelects = keys.map((k) => `${k.key} AS ${k.alias}`).join(", ");
  const keyGroupBys = keys.map((k) => k.alias).join(", ");

  const query = `
      WITH request_counts AS (
        SELECT
          ${keySelects},
          ${aggregateFunction} AS agg_value
        FROM request_response_rmt
        WHERE ${filter}
        GROUP BY ${keyGroupBys} 
      ),
      percentiles AS (
        SELECT
          ${buildPercentileClause("agg_value")}
        FROM request_counts
      )
      SELECT
        arrayJoin(histogram(10)(agg_value)) AS hist
      FROM request_counts, percentiles
      WHERE ${buildWhereClause("agg_value")}
      `;

  const requestCount = await clickhouseDb.dbQuery<{
    hist: [number, number, number];
  }>(query, argsAcc);
  if (!requestCount?.data) {
    return err("No request count found");
  }

  return ok(
    requestCount.data.map((row) => ({
      range_start: row.hist[0].toString(),
      range_end: row.hist[1].toString(),
      value: row.hist[2],
    })),
  );
}

export interface KeyDefinition {
  key: string;
  alias: string;
}

export interface AverageRow {
  average: number;
}

export interface GetAverageOnKeysOptions {
  key: KeyDefinition;
  builtFilter: Awaited<ReturnType<typeof buildFilterWithAuthClickHouse>>;
  aggregateFunction?: string;
}

export async function getAveragePerSession({
  key,
  builtFilter,
  aggregateFunction,
}: GetAverageOnKeysOptions): Promise<Result<AverageRow[], string>> {
  const { filter, argsAcc } = builtFilter;

  const query = `
  SELECT avg(${key.alias}) as average
    FROM
    (
      SELECT ${aggregateFunction} as ${key.alias}
      FROM request_response_rmt
      WHERE ${filter}
      GROUP BY ${key.key}
    )
  `;

  const res = await clickhouseDb.dbQuery<AverageRow>(query, argsAcc);
  if (res.error) {
    return res;
  }
  return ok(res.data!);
}
