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
    @Body() requestBody: {},
    @Request() request: JawnAuthenticatedRequest
  ) {
    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: request.authParams.organizationId,
      argsAcc: [],
      filter: "all",
    });

    // Modified query to ensure properties with hidden=true are excluded
    const query = `
    SELECT DISTINCT 
      property_key as property
    FROM (
      SELECT 
        arrayJoin(mapKeys(properties)) as property_key,
        properties[property_key] as value,
        properties[concat(property_key, '.hidden')] as is_hidden
      FROM request_response_rmt
      WHERE (${builtFilter.filter})
    )
    WHERE (is_hidden IS NULL OR is_hidden != 'true')
    AND property_key NOT LIKE '%.hidden'
    ORDER BY property
    `;

    return await cacheResultCustom(
      "v1/property/query" + request.authParams.organizationId,
      async () => await dbQueryClickhouse<Property>(query, builtFilter.argsAcc),
      kvCache
    );
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
  @Post("update")
  public async updatePropertyVisibility(
    @Body() requestBody: { property_name: string; hidden: boolean },
    @Request() request: JawnAuthenticatedRequest
  ) {
    const { property_name, hidden } = requestBody;
    const orgId = request.authParams.organizationId;

    // Debug query to inspect the current properties for the given property
    const debugQuery = `
      SELECT 
        properties,
        properties['${property_name}'] AS value,
        properties['${property_name}.hidden'] AS is_hidden
      FROM request_response_rmt
      WHERE organization_id = '${orgId}'
        AND has(properties, '${property_name}')
      LIMIT 5;
    `;

    // Log pre-update debug values
    console.log(
      "Pre-update debug values:",
      await dbQueryClickhouse(debugQuery, [])
    );

    // Use mapConcat with map() to merge in the hidden field for the property.
    const updateQuery = `
      ALTER TABLE request_response_rmt
      UPDATE properties = mapConcat(
        properties, 
        map('${property_name}.hidden', '${hidden.toString()}')
      )
      WHERE organization_id = '${orgId}'
        AND has(properties, '${property_name}')
    `;

    console.log("Executing update query:", updateQuery);

    try {
      await dbQueryClickhouse(updateQuery, []);
      await kvCache.del("v1/property/query" + orgId);

      // Post-update debug: verify that the hidden field was added
      const postUpdateDebug = await dbQueryClickhouse(debugQuery, []);
      console.log("Post-update debug values:", postUpdateDebug);

      // Optionally, retrieve updated properties to check that the property is now hidden in the frontend
      const properties = await this.getProperties({}, request);
      console.log("Properties returned by getProperties:", properties);

      return {
        properties,
        success: true,
        message: "Property visibility updated successfully",
      };
    } catch (error) {
      console.error("Error executing ClickHouse query:", updateQuery);
      console.error(error);
      throw error;
    }
  }
}
