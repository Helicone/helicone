import { FilterNode } from "@helicone-package/filters/filterDefs";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { Result, resultMap } from "@/packages/common/result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getTokensPerRequest(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string,
): Promise<
  Result<
    {
      average_prompt_tokens_per_response: number;
      average_completion_tokens_per_response: number;
      average_total_tokens_per_response: number;
    },
    string
  >
> {
  const { filter: filterString, argsAcc } = await buildFilterWithAuthClickHouse(
    {
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    },
  );
  const query = `
  WITH total_count AS (
    SELECT 
      count(*) as count,
      sum(request_response_rmt.prompt_tokens) as sum_prompt_tokens,
      sum(request_response_rmt.completion_tokens) as sum_completion_tokens
    FROM request_response_rmt
    WHERE (
      (${filterString})
    )
  )
  SELECT CASE
    WHEN count = 0 THEN 0
    ELSE sum_prompt_tokens / count
  END as average_prompt_tokens_per_response,
  CASE
    WHEN count = 0 THEN 0
    ELSE sum_completion_tokens / count
  END as average_completion_tokens_per_response,
  CASE
    WHEN count = 0 THEN 0
    ELSE (sum_prompt_tokens + sum_completion_tokens) / count
  END as average_total_tokens_per_response
  FROM total_count
`;

  const res = await dbQueryClickhouse<{
    average_prompt_tokens_per_response: number;
    average_completion_tokens_per_response: number;
    average_total_tokens_per_response: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => {
    const data = d[0];
    return {
      average_prompt_tokens_per_response:
        +data.average_prompt_tokens_per_response,
      average_completion_tokens_per_response:
        +data.average_completion_tokens_per_response,
      average_total_tokens_per_response:
        +data.average_total_tokens_per_response,
    };
  });
}
