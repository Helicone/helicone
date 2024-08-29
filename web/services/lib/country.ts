import { dbQueryClickhouse } from "../../lib/api/db/dbExecute";
import { Result } from "../../lib/result";
import { FilterNode } from "./filters/filterDefs";
import {
  buildFilterClickHouse,
  buildFilterWithAuthClickHouse,
} from "./filters/filters";

export interface CountryData {
  country: string;
  total_requests: number;
}

export async function getCountries(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  timeFilter: {
    start: Date;
    end: Date;
  }
): Promise<Result<CountryData[], string>> {
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
      country_code as country,
      count() as total_requests
    FROM
      request_response_rmt
    WHERE
      ${builtFilter.filter} AND country IS NOT NULL
    GROUP BY
      request_response_rmt.country_code
    ORDER BY
      total_requests DESC
    LIMIT
      ${limit}
    OFFSET
      ${offset}
  `;

  const { data, error } = await dbQueryClickhouse<CountryData>(
    query,
    havingFilter.argsAcc
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
