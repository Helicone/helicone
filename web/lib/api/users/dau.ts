import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getDailyActiveUsers(org_id: string, filter: FilterNode) {
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id,
    argsAcc: [],
    filter,
  });

  const query = `
SELECT date_trunc('day'::text, request_created_at) AS time_step,
  count(DISTINCT request_response_rmt.user_id) AS user_count_step,
  count(request_response_rmt.request_id) AS request_count_step
FROM request_response_rmt
WHERE (${builtFilter.filter})
GROUP BY (date_trunc('day'::text, request_created_at))
ORDER BY (date_trunc('day'::text, request_created_at)) DESC;
  `;

  const res = await dbQueryClickhouse<{
    time_step: Date;
    user_count_step: number;
    request_count_step: number;
  }>(query, builtFilter.argsAcc);
  return resultMap(res, (r) =>
    r
      .map((r) => ({
        time_step: new Date(r.time_step),
        user_count_step: +r.user_count_step,
        request_count_step: +r.request_count_step,
      }))
      .reverse()
  );
}
