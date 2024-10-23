import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";

import { KVCache } from "../../lib/cache/kvCache";
import { JawnAuthenticatedRequest } from "../../types/request";
import { cacheResultCustom } from "../../utils/cacheResult";

export interface Property {
  property: string;
}

const kvCache = new KVCache(5 * 60 * 1000); // 5 minutes

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
}
