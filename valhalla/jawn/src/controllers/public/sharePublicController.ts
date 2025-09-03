import {
  Controller,
  Get,
  Path,
  Query,
  Route,
  Tags,
} from "tsoa";
import { Result, err, ok, resultMap } from "../../packages/common/result";
import { dbExecute, dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { RequestManager } from "../../managers/request/RequestManager";
import {
  DataOverTimeRequest,
  getXOverTime,
} from "../../managers/helpers/getXOverTime";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { HeliconeRequest } from "@helicone-package/llm-mapper/types";

type ShareScope = "dashboard" | "metrics" | "requests" | "logs";

type ShareRow = {
  id: string;
  organization_id: string;
  scope: ShareScope;
  filters: any | null;
  time_start: string | null;
  time_end: string | null;
  name: string | null;
  allow_request_bodies: boolean;
};

function buildCombinedFilter(
  savedFilter: any | null,
  timeStart: string | null,
  timeEnd: string | null,
): FilterNode {
  const timeFilter: FilterNode | "all" =
    timeStart && timeEnd
      ? {
          left: {
            request_response_rmt: {
              request_created_at: {
                gte: new Date(timeStart),
              },
            },
          },
          operator: "and",
          right: {
            request_response_rmt: {
              request_created_at: {
                lte: new Date(timeEnd),
              },
            },
          },
        }
      : "all";

  if (!savedFilter && timeFilter === "all") return "all";
  if (!savedFilter && timeFilter !== "all") return timeFilter;
  if (savedFilter && timeFilter === "all") return savedFilter as FilterNode;
  return {
    left: (savedFilter as FilterNode) ?? "all",
    operator: "and",
    right: timeFilter as FilterNode,
  } as FilterNode;
}

@Route("v1/public/share")
@Tags("Share")
export class SharePublicController extends Controller {
  @Get("/{id}/data")
  public async getShareData(
    @Path() id: string,
    @Query() limit: number = 50,
    @Query() offset: number = 0,
  ): Promise<
    Result<
      {
        share: ShareRow;
        metrics: {
          totalRequests: number;
          requestsOverTime: { created_at_trunc: string; count: number }[];
          totalCost: number;
        };
        requests: HeliconeRequest[];
      },
      string
    >
  > {
    // 1) Load share row and validate
    const now = new Date().toISOString();
    const shareRes = await dbExecute<ShareRow & { expires_at: string | null }>(
      `select id, organization_id, scope, filters, time_start, time_end, name, allow_request_bodies, expires_at, revoked
       from public_share_link
       where id = $1 and revoked = false and (expires_at is null or expires_at > $2)
       limit 1`,
      [id, now],
    );
    if (shareRes.error) {
      this.setStatus(500);
      return err(shareRes.error);
    }
    if (!shareRes.data || shareRes.data.length === 0) {
      this.setStatus(404);
      return err("Not found");
    }
    const share = shareRes.data[0];

    // 2) Build filters/time
    const combinedFilter = buildCombinedFilter(
      share.filters,
      share.time_start,
      share.time_end,
    );

    const timeFilter = {
      start: share.time_start ?? new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      end: share.time_end ?? new Date().toISOString(),
    };

    // 3) Metrics: totalRequests and requestsOverTime, totalCost
    // 3a) totalRequests
    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: share.organization_id,
      filter: combinedFilter,
      argsAcc: [],
    });
    const countQuery = `
      SELECT COUNT(*) as count
      FROM request_response_rmt
      WHERE (${builtFilter.filter})
    `;
    const totalRequestsRes = await dbQueryClickhouse<{ count: number }>(
      countQuery,
      builtFilter.argsAcc,
    );

    // 3b) totalCost
    const costQuery = `
      SELECT coalesce(sum(cost_usd), 0.0) as total_cost
      FROM request_response_rmt
      WHERE (${builtFilter.filter})
    `;
    const totalCostRes = await dbQueryClickhouse<{ total_cost: number }>(
      costQuery,
      builtFilter.argsAcc,
    );

    // 3c) requestsOverTime
    const requestsOverTimeRes = await getXOverTime<{ count: number }>(
      {
        userFilter: (share.filters as any) ?? "all",
        timeFilter,
        dbIncrement: "day",
        timeZoneDifference: 0,
      } as DataOverTimeRequest,
      {
        orgId: share.organization_id,
        countColumns: ["count(*) as count"],
        groupByColumns: [],
      },
    );

    if (totalRequestsRes.error || totalCostRes.error || requestsOverTimeRes.error) {
      this.setStatus(500);
      return err(
        totalRequestsRes.error || totalCostRes.error || requestsOverTimeRes.error || "Unknown error",
      );
    }

    // 4) Requests list
    const reqManager = new RequestManager({ organizationId: share.organization_id });
    const requestsRes = await reqManager.getRequestsClickhouse({
      filter: combinedFilter as any,
      offset,
      limit,
      sort: { created_at: "desc" },
    } as any);

    if (requestsRes.error) {
      this.setStatus(500);
      return err(requestsRes.error);
    }

    this.setStatus(200);
    return ok({
      share,
      metrics: {
        totalRequests: totalRequestsRes.data?.[0]?.count ?? 0,
        totalCost: totalCostRes.data?.[0]?.total_cost ?? 0,
        requestsOverTime: (requestsOverTimeRes.data ?? []).map((d) => ({
          created_at_trunc: d.created_at_trunc,
          count: (d as any).count ?? 0,
        })),
      },
      requests: requestsRes.data ?? [],
    });
  }
}


