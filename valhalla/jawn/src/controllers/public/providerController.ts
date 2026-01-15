import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { err, ok, Result } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";

export interface ProviderMetric {
  provider: string;
  total_requests: number;
}

interface ProviderQueryParams {
  filter: FilterNode;
  offset: number;
  limit: number;
  timeFilter: {
    start: string;
    end: string;
  };
}

@Route("/v1/providers")
@Tags("Providers")
@Security("api_key")
export class ProviderController extends Controller {
  @Post("/")
  public async getProviders(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: ProviderQueryParams
  ): Promise<Result<ProviderMetric[], string>> {
    const { filter, offset, limit, timeFilter } = body;

    if (isNaN(offset) || isNaN(limit)) {
      this.setStatus(400);
      return err("Invalid offset or limit");
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: request.authParams.organizationId,
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

    // Use count(*) instead of count(DISTINCT request_id) for better performance
    // Each row in request_response_rmt represents a unique request
    const result = await dbQueryClickhouse<ProviderMetric>(
      `
      SELECT
        provider,
        count(*) as total_requests
      FROM request_response_rmt
      WHERE ${builtFilter.filter}
      GROUP BY provider
      ORDER BY total_requests DESC
      LIMIT ${limit}
      OFFSET ${offset}
      `,
      builtFilter.argsAcc
    );

    if (result.error || !result.data) {
      this.setStatus(500);
      return err(
        JSON.stringify(result.error) || "Failed to fetch providers"
      );
    } else {
      this.setStatus(200);
      return ok(result.data ?? []);
    }
  }
}
