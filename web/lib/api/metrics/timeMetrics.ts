import { Result } from "../../result";
import { dbExecute } from "../db/dbExecute";
import {
  buildFilter,
  buildFilterWithAuth,
  buildFilterWithAuthRequest,
} from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export interface AverageResponseTime {
  average_response_time: number;
  average_tokens_per_response: number;
}
export async function getAggregatedAvgMetrics(
  filter: FilterNode,
  user_id: string
): Promise<Result<AverageResponseTime, string>> {
  const { filter: filterString, argsAcc } = await buildFilterWithAuthRequest({
    filter,
    argsAcc: [],
    user_id,
  });
  const query = `
  SELECT avg(response.delay_ms::float/1000.0)::float AS average_response_time,
  avg(response.completion_tokens + response.prompt_tokens)::float AS average_tokens_per_response
  FROM request
    LEFT JOIN response ON response.request = request.id
WHERE (
  (${filterString})
)
`;
  const { data, error } = await dbExecute<AverageResponseTime>(query, argsAcc);
  if (error !== null) {
    return { data: null, error: error };
  }

  return { data: data[0], error: null };
}
