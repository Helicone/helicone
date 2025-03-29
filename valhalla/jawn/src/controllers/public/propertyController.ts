import {
  Body,
  Controller,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";

import { KVCache } from "../../lib/cache/kvCache";
import { JawnAuthenticatedRequest } from "../../types/request";
import { cacheResultCustom } from "../../utils/cacheResult";
import { clickhousePriceCalc } from "../../packages/cost";
import { resultMap } from "../../lib/shared/result";

export interface Property {
  property: string;
}

export interface TimeFilterRequest {
  timeFilter: {
    start: string;
    end: string;
  };
}

const kvCache = new KVCache(60 * 1000); // 5 minutes

@Route("v1/property")
@Tags("Property")
@Security("api_key")
export class PropertyController extends Controller {
  @Post("query")
  public async getProperties(
    @Body()
    requestBody: {},
    @Request() request: JawnAuthenticatedRequest
  ) {
    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: request.authParams.organizationId,
      argsAcc: [],
      filter: "all",
    });

    const query = `
    SELECT DISTINCT arrayJoin(mapKeys(properties)) AS property
    FROM request_response_rmt
    WHERE (
      ${builtFilter.filter}
    )
  `;

    return await cacheResultCustom(
      "v1/property/query" + request.authParams.organizationId,
      async () => await dbQueryClickhouse<Property>(query, builtFilter.argsAcc),
      kvCache
    );
  }

  // Gets all possible values for a property
  @Post("{propertyKey}/search")
  public async searchProperties(
    @Request() request: JawnAuthenticatedRequest,
    @Path() propertyKey: string,
    @Body()
    requestBody: {
      searchTerm: string;
    }
  ) {
    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: request.authParams.organizationId,
      argsAcc: [propertyKey],
      filter: {
        request_response_rmt: {
          properties: {
            [propertyKey]: {
              ilike: `%${requestBody.searchTerm}%`,
            },
          },
        },
      },
    });

    const query = `
    SELECT DISTINCT value AS property
    FROM request_response_rmt
    ARRAY JOIN mapKeys(properties) AS key, mapValues(properties) AS value
    WHERE (
      ${builtFilter.filter} AND key = {val_0: String}
    )
    LIMIT 25
  `;

    const res = await dbQueryClickhouse<{ property: string }>(
      query,
      builtFilter.argsAcc
    );

    return resultMap(res, (data) => data.map((r) => r.property));
  }

  @Post("{propertyKey}/top-costs/query")
  public async getTopCosts(
    @Request() request: JawnAuthenticatedRequest,
    @Path() propertyKey: string,
    @Body() requestBody: TimeFilterRequest
  ) {
    if (!propertyKey) {
      throw new Error("Property key is required");
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: request.authParams.organizationId,
      argsAcc: [],
      filter: {
        left: {
          request_response_rmt: {
            request_created_at: {
              gt: new Date(requestBody.timeFilter.start),
            },
          },
        },
        operator: "and",
        right: {
          request_response_rmt: {
            request_created_at: {
              lt: new Date(requestBody.timeFilter.end),
            },
          },
        },
      },
    });

    const args = builtFilter.argsAcc.concat([propertyKey]);

    const propertySQLKey = `{val_${args.length - 1} : String}`;

    // Query to get the top 10 costs
    const topQuery = `
    SELECT
      properties[${propertySQLKey}] as value,
      ${clickhousePriceCalc("request_response_rmt")} as cost
    FROM request_response_rmt
    WHERE (
      ${builtFilter.filter}
      AND properties[${propertySQLKey}] IS NOT NULL
    )
    GROUP BY properties[${propertySQLKey}]
    ORDER BY cost DESC
    LIMIT 10
    `;

    // Query to get the total cost for this property
    const totalQuery = `
    SELECT
      ${clickhousePriceCalc("request_response_rmt")} as cost
    FROM request_response_rmt
    WHERE (
      ${builtFilter.filter}
      AND properties[${propertySQLKey}] IS NOT NULL
    )
    `;

    // Execute both queries
    const [topRes, totalRes] = await Promise.all([
      dbQueryClickhouse<{ value: string; cost: number }>(topQuery, args),
      dbQueryClickhouse<{ cost: number }>(totalQuery, args),
    ]);

    return resultMap(topRes, (data) => {
      // Calculate the sum of the top 10 costs
      const topCosts = data.map((d) => ({
        value: d.value,
        cost: +d.cost,
      }));

      // Get the total cost
      const totalCost = totalRes.data?.[0]?.cost || 0;

      // Calculate the "other" category cost (total minus sum of top 10)
      const topCostsSum = topCosts.reduce((sum, item) => sum + item.cost, 0);
      const otherCost = totalCost - topCostsSum;

      // Only add the "other" category if it has a positive cost
      if (otherCost > 0) {
        return [
          ...topCosts,
          {
            value: "Other",
            cost: otherCost,
          },
        ];
      }

      return topCosts;
    });
  }
}
