import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";
import { Result, resultMap } from "../../result";
import { Database } from "../../../supabase/database.types";
import {
  buildFilter,
  buildFilterClickHouse,
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildUserSort,
  SortLeafUsers,
} from "../../../services/lib/sorts/users/sorts";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";

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

function fillMissingDatesWithZero(data) {
  let currentDate = data[0].time_step;
  const endDate = data[data.length - 1].time_step;

  const resultsWithZeroes = [];

  while (currentDate <= endDate) {
    const found = data.find((item) => isSameDay(item.time_step, currentDate));
    if (found) {
      resultsWithZeroes.push(found);
    } else {
      resultsWithZeroes.push({
        time_step: new Date(currentDate),
        user_count_step: 0,
        request_count_step: 0,
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return resultsWithZeroes;
}

function isSameDay(d1, d2) {
  return (
    d1.getYear() === d2.getYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
