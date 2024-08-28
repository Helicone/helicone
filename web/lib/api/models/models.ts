import { clickhousePriceCalc } from "../../../packages/cost";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterClickHouse,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface ModelMetric {
  id?: string;
  model: string;
  total_requests: number;
  total_completion_tokens: number;
  total_prompt_token: number;
  total_tokens: number;
  cost: number;
}

export async function modelMetrics(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  timeFilter: {
    start: Date;
    end: Date;
  }
): Promise<Result<ModelMetric[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }

  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    argsAcc: [],
    filter: {
      left: filter,
      operator: "and",
      right: {
        left: {
          request_response_rmt: {
            request_created_at: {
              gte: new Date(timeFilter.start),
            },
          },
        },
        operator: "and",
        right: {
          request_response_rmt: {
            request_created_at: {
              lte: new Date(timeFilter.end),
            },
          },
        },
      },
    },
  });

  const havingFilter = buildFilterClickHouse({
    filter,
    having: true,
    argsAcc: builtFilter.argsAcc,
  });
  const query = `
SELECT
request_response_rmt.model as model,
  count(DISTINCT request_id) as total_requests,
  sum(request_response_rmt.completion_tokens) as total_completion_tokens,
  sum(request_response_rmt.prompt_tokens) as total_prompt_token,
  sum(request_response_rmt.prompt_tokens) + sum(request_response_rmt.completion_tokens) as total_tokens,
  (${clickhousePriceCalc("request_response_rmt")}) as cost
from request_response_rmt
WHERE (${builtFilter.filter})
GROUP BY request_response_rmt.model
HAVING (${havingFilter.filter})
ORDER BY total_requests DESC 
LIMIT ${limit}
OFFSET ${offset}
  `;

  const { data, error } = await dbQueryClickhouse<ModelMetric>(
    query,
    havingFilter.argsAcc
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
