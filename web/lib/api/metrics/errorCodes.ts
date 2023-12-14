import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

/**
 * Retrieves error codes and their corresponding counts from the database.
 * @param filter - The filter node to apply to the query.
 * @param timeFilter - The time range to filter the data.
 * @param org_id - The ID of the organization.
 * @returns A promise that resolves to an array of error codes and their counts.
 */
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
        left: timeFilterToFilterNode(timeFilter, "response_copy_v3"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    }
  );
  const query = `
  SELECT
    response_copy_v3.status as error_code,
    count(*) AS count
  FROM response_copy_v3
  WHERE (
    ${filterString}
  )
  GROUP BY response_copy_v3.status
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
