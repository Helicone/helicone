import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface Quantiles {
  percentile: number;
  value: number;
}

export default async function quantilesCalc(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  column: string,
  org_id: string
): Promise<Result<Quantiles[], string>> {
  const { filter: filterString, argsAcc } = await buildFilterWithAuthClickHouse(
    {
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "request_response_log"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    }
  );

  const percentiles = [0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 0.999];

  const query = `SELECT quantilesExactExclusive
  (${percentiles.join(",")})(${column})  
  FROM (SELECT latency from request_response_log WHERE (
      (${filterString})
    ) 
  `;

  const res = await dbQueryClickhouse<{ quantiles: number[] }>(query, argsAcc);

  return resultMap(res, (d) => {
    const data = d[0];
    return data.quantiles.map((value, idx) => ({
      percentile: percentiles[idx],
      value,
    }));
  });
}
