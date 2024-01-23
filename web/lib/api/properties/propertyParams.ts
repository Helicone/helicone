import {
  FilterLeaf,
  FilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHousePropResponse } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface PropertyParam {
  property_param: string;
  property_key: string;
}

function getFilterSearchFilterNode(
  property: string,
  search: string
): FilterNode {
  const propertyFilter: FilterLeaf = {
    property_with_response_v1: {
      property_key: {
        equals: property,
      },
    },
  };
  if (search === "") {
    return propertyFilter;
  }
  const searchFilter: FilterLeaf = {
    property_with_response_v1: {
      property_value: {
        contains: search,
      },
    },
  };
  return {
    left: propertyFilter,
    right: searchFilter,
    operator: "and",
  };
}

export async function getPropertyParams(
  org_id: string,
  property: string,
  search: string
): Promise<Result<PropertyParam[], string>> {
  const builtFilter = await buildFilterWithAuthClickHousePropResponse({
    org_id,
    filter: getFilterSearchFilterNode(property, search),
    argsAcc: [],
  });

  const query = `
  SELECT distinct property_key, property_value as property_param
  from property_with_response_v1
  where (
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
