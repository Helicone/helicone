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
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import { buildFilterWithAuthClickHouse, buildFilterWithAuthClickHouseOrganizationProperties } from "@helicone-package/filters/filters";
import { resultMap } from "../../packages/common/result";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { getFromCache, storeInCache, clearCache } from "../../lib/cache/staticMemCache";

export interface Property {
	property: string;
}

export interface TimeFilterRequest {
	timeFilter: {
		start: string;
		end: string;
	};
}

// Properties queries are cached per-org via staticMemCache (see below)

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
		const builtFilter = await buildFilterWithAuthClickHouseOrganizationProperties({
			org_id: request.authParams.organizationId,
			argsAcc: [],
			filter: {},
		});

		const query = `
    SELECT DISTINCT organization_properties.property_key AS property
    FROM organization_properties
    LEFT JOIN default.hidden_property_keys AS hp
      ON hp.organization_id = organization_properties.organization_id
     AND hp.key = organization_properties.property_key
    WHERE (
      ${builtFilter.filter}
      AND (hp.is_hidden = 0 OR hp.is_hidden IS NULL)
    )
  `;

		// Cache the properties per org; if absent, fetch and store. Fail open on cache errors.
		const key = "v1/property/query" + request.authParams.organizationId;
		try {
			const cached = await getFromCache(key);
			if (cached) {
				try {
					const parsed: Property[] = JSON.parse(cached);
					return { data: parsed, error: null };
				} catch (_) {
					// fall through to fetch
				}
			}
		} catch (_) {
			// ignore cache read errors
		}

		const properties = await dbQueryClickhouse<Property>(
			query,
			builtFilter.argsAcc
		);

		if (properties.error === null) {
			try {
				const ttl = Number(process.env.PROPERTIES_CACHE_TTL_SECONDS ?? "15");
				await storeInCache(key, JSON.stringify(properties.data), ttl);
			} catch (_) {
				// ignore cache write errors
			}
		}

		return properties;
	}

	@Post("hide")
	public async hideProperty(
		@Body()
		requestBody: { key: string },
		@Request() request: JawnAuthenticatedRequest
	) {
		const orgId = request.authParams.organizationId;
		const key = requestBody.key;

		if (!key || typeof key !== "string") {
			throw new Error("Property key is required");
		}

		// Ensure any existing entry is removed, then insert hidden flag
		const deleteQuery = `
      ALTER TABLE default.hidden_property_keys
      DELETE WHERE organization_id = {val_0: UUID} AND key = {val_1: String}
    `;
		const delRes = await dbQueryClickhouse(deleteQuery, [orgId, key]);
		if (delRes.error) {
			return delRes;
		}

		const insRes = await clickhouseDb.dbInsertClickhouse("hidden_property_keys", [
			{ organization_id: orgId, key, is_hidden: 1 },
		]);
		if (insRes.error) {
			return insRes;
		}

		await clearCache("v1/property/query" + orgId);

		return { data: { ok: true }, error: null };
	}

	@Post("hidden/query")
	public async getHiddenProperties(
		@Request() request: JawnAuthenticatedRequest
	) {
		const orgId = request.authParams.organizationId;

		const query = `
    SELECT key AS property
    FROM default.hidden_property_keys
    WHERE organization_id = {val_0: UUID}
      AND is_hidden = 1
    ORDER BY key
  `;

		return dbQueryClickhouse<Property>(query, [orgId]);
	}

	@Post("restore")
	public async restoreProperty(
		@Body()
		requestBody: { key: string },
		@Request() request: JawnAuthenticatedRequest
	) {
		const orgId = request.authParams.organizationId;
		const key = requestBody.key;

		if (!key || typeof key !== "string") {
			throw new Error("Property key is required");
		}

		const deleteQuery = `
      ALTER TABLE default.hidden_property_keys
      DELETE WHERE organization_id = {val_0: UUID} AND key = {val_1: String}
    `;
		const delRes = await dbQueryClickhouse(deleteQuery, [orgId, key]);
		if (delRes.error) {
			return delRes;
		}

		const insRes = await clickhouseDb.dbInsertClickhouse("hidden_property_keys", [
			{ organization_id: orgId, key, is_hidden: 0 },
		]);
		if (insRes.error) {
			return insRes;
		}

		await clearCache("v1/property/query" + orgId);

		return { data: { ok: true }, error: null };
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
      sum(cost) / ${COST_PRECISION_MULTIPLIER} as cost
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
      sum(cost) / ${COST_PRECISION_MULTIPLIER} as cost
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
