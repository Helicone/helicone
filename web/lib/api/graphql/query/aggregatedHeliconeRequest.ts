import { ApolloError } from "apollo-server-errors";
import { Context } from "../../../../pages/api/graphql";
import {
  FilterLeaf,
  filterListToTree,
  FilterNode,
  SingleKey,
  TablesAndViews,
  TextOperators,
  TimestampOperators,
} from "../../../../services/lib/filters/filterDefs";
import {
  getRequestCount,
  getRequestCountClickhouse,
  getRequests,
  getRequestsDateRange,
} from "../../request/request";
import { getOrgIdOrThrow, getUserOrThrow } from "../helpers/auth";
import {
  HeliconeRequest,
  QueryHeliconeRequestArgs,
  HeliconeRequestFilter,
  TextOperators as GQLTextOperators,
  PropertyFilter,
  DateOperators,
  AggregatedHeliconeRequest,
  QueryAggregatedHeliconeRequestArgs,
} from "../schema/types/graphql";
import { modelCost } from "../../metrics/costCalc";
import { convertTextOperators } from "./helper";
import {
  getTotalCostProperties,
  getTotalCostRaw,
} from "../../property/totalCosts";
import { getCacheCount, getModelMetrics } from "../../cache/stats";
import { resultMap, resultsAll } from "../../../result";

export async function aggregatedHeliconeRequest(
  root: any,
  args: QueryAggregatedHeliconeRequestArgs,
  context: Context,
  info: any
): Promise<AggregatedHeliconeRequest> {
  const orgId = await context.getOrgIdOrThrow();
  const { properties } = {
    properties: args.properties ?? [],
  };

  const postgrestPropertyFilter: FilterNode[] = properties.map((p) => ({
    properties: {
      [p.name]: convertTextOperators(p.value),
    },
  }));

  const { data: cost, error: costError } = await getTotalCostProperties(
    properties,
    orgId
  );

  const { data: dateRange, error: dateError } = await getRequestsDateRange(
    orgId,
    filterListToTree(postgrestPropertyFilter, "and")
  );

  if (dateError !== null || costError !== null) {
    throw new ApolloError(
      (dateError || costError) ?? "",
      "INTERNAL_SERVER_ERROR"
    );
  }

  // TODO this is the wrong way to implement it... we should do the like nesting thing we are doing with users
  const requestedFields = info.fieldNodes[0].selectionSet.selections.map(
    (x: any) => x.name.value
  );

  async function getCacheData() {
    const savedUSD = await resultMap(
      await getModelMetrics(
        orgId,
        filterListToTree(postgrestPropertyFilter, "and")
      ),
      (modelMetrics) =>
        modelMetrics.reduce(
          (acc, modelMetric) => acc + modelCost(modelMetric),
          0
        )
    );

    const hits = await getCacheCount(
      orgId,
      filterListToTree(postgrestPropertyFilter, "and")
    );
    const misses = await getRequestCount(
      orgId,
      filterListToTree(postgrestPropertyFilter, "and")
    );
    if (
      hits.error !== null ||
      misses.error !== null ||
      savedUSD.error !== null
    ) {
      throw new ApolloError(
        (hits.error || misses.error || savedUSD.error) ?? "",
        "INTERNAL_SERVER_ERROR"
      );
    }
    return {
      hits: hits.data,
      misses: misses.data,
      savedUSD: savedUSD.data,
    };
  }

  return {
    id: "1",
    cost: cost,
    costUSD: cost,
    firstRequest: dateRange.min.toISOString(),
    lastRequest: dateRange.max.toISOString(),
    cache: requestedFields.includes("cache") ? await getCacheData() : undefined,
  };
}
