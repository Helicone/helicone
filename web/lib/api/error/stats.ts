import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import {
  SortLeafRequest,
  buildRequestSort,
} from "../../../services/lib/sorts/requests/sorts";
import { Json } from "../../../supabase/database.types";
import { Result, resultMap } from "../../result";
import {
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";
import { ModelMetrics } from "../metrics/modelMetrics";
import { DataOverTimeRequest } from "../metrics/timeDataHandlerWrapper";

export async function statusCodesLastMonth(orgId: string, filter: FilterNode) {
  const builtFilter = await buildFilterWithAuthClickHouse({
    filter,
    argsAcc: [],
    org_id: orgId,
  });
  const query = `
SELECT
  response_copy_v2.status as error_code,
  count(*) AS count
FROM response_copy_v2
WHERE (
  (${builtFilter.filter})
  AND response_copy_v2.status is not null
  AND response_copy_v2.request_created_at >= now() - INTERVAL '1 MONTH'
)
GROUP BY response_copy_v2.status
`;
  return resultMap(
    await dbQueryClickhouse<{
      error_code: number;
      count: number;
    }>(query, builtFilter.argsAcc),
    (x) =>
      x.map((y) => ({
        error_code: +y.error_code,
        count: +y.count,
      }))
  );
}

export async function getErrorsOverTime({
  timeFilter,
  userFilter,
  orgId,
  dbIncrement,
  timeZoneDifference,
}: DataOverTimeRequest) {
  const filter: FilterNode = userFilter;
  if (!isValidTimeIncrement(dbIncrement)) {
    return { data: null, error: "Invalid time increment" };
  }
  if (!isValidTimeZoneDifference(timeZoneDifference)) {
    return { data: null, error: "Invalid time zone difference" };
  }
  const builtFilter = await buildFilterWithAuthClickHouse({
    filter,
    argsAcc: [],
    org_id: orgId,
  });
  const dateTrunc = `DATE_TRUNC('${dbIncrement}', response_copy_v2.request_created_at + INTERVAL '${timeZoneDifference} minute')`;
  const query = `
SELECT
  response_copy_v2.status as error_code,
  ${dateTrunc} as created_at_trunc,
  count(*) AS count
FROM response_copy_v2
WHERE (
  (${builtFilter.filter})
)
GROUP BY response_copy_v2.status, ${dateTrunc}
`;
  return resultMap(
    await dbQueryClickhouse<{
      error_code: number;
      created_at_trunc: Date;
      count: number;
    }>(query, builtFilter.argsAcc),
    (x) =>
      x.map((y) => ({
        error_code: +y.error_code,
        created_at_trunc: new Date(y.created_at_trunc),
        count: +y.count,
      }))
  );
}
