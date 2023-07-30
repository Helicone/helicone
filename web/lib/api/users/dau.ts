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
  count(DISTINCT response_copy_v3.user_id) AS user_count_step,
  count(response_copy_v3.request_id) AS request_count_step
FROM response_copy_v3
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
