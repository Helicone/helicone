import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getErrorCodes(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
) {
  const { filter: filterString, argsAcc } = await buildFilterWithAuthClickHouse(
    {
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "request_response_versioned"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    }
  );
  const query = `
  SELECT
  request_response_versioned.status as error_code,
    count(*) AS count
  FROM request_response_versioned
  WHERE (
    ${filterString}
  )
  GROUP BY request_response_versioned.status
`;

  return resultMap(
    await dbQueryClickhouse<{
      error_code: number;
      count: number;
    }>(query, argsAcc),
    (x) =>
      x.map((y) => ({
        error_code: +y.error_code,
        count: +y.count,
      }))
  );
}
