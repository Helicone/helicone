import {
  FilterLeaf,
  FilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHousePropertiesV2 } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface PropertyParam {
  property_param: string;
  property_key: string;
}

function getFilterSearchFilterNodeV2(
  property: string,
  search: string
): FilterNode {
  const propertyFilter: FilterLeaf = {
    request_response_rmt: {
      search_properties: {
        [property]: {
          equals: property,
        },
      },
    },
  };
  if (search === "") {
    return propertyFilter;
  }
  const searchFilter: FilterLeaf = {
    request_response_rmt: {
      properties: {
        [property]: {
          contains: search,
        },
      },
    },
  };
  return {
    left: propertyFilter,
    right: searchFilter,
    operator: "and",
  };
}

export async function getPropertyParamsV2(
  org_id: string,
  property: string,
  search: string
): Promise<Result<PropertyParam[], string>> {
  const builtFilter = await buildFilterWithAuthClickHousePropertiesV2({
    org_id,
    filter: getFilterSearchFilterNodeV2(property, search),
    argsAcc: [],
  });

  const query = `
  SELECT DISTINCT
    key AS property_key,
    value AS property_param
  FROM request_response_rmt
  ARRAY JOIN mapKeys(properties) AS key, mapValues(properties) AS value
  WHERE (
    ${builtFilter.filter}
  )
  limit 100
`;

  const { data, error } = await dbQueryClickhouse<PropertyParam>(
    query,
    builtFilter.argsAcc
  );

  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
