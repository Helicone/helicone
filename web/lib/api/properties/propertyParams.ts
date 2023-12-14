import {
  FilterLeaf,
  FilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouseProperties } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

/**
 * Represents a property parameter.
 */
export interface PropertyParam {
  property_param: string;
  property_key: string;
}

/**
 * Returns a FilterNode object based on the provided property and search parameters.
 * If the search parameter is an empty string, the returned FilterNode will only filter by the property.
 * If the search parameter is not empty, the returned FilterNode will filter by both the property and the search value.
 *
 * @param property - The property to filter by.
 * @param search - The search value to filter by.
 * @returns The FilterNode object representing the filter criteria.
 */
function getFilterSearchFilterNode(
  property: string,
  search: string
): FilterNode {
  const propertyFilter: FilterLeaf = {
    properties_copy_v2: {
      key: {
        equals: property,
      },
    },
  };
  if (search === "") {
    return propertyFilter;
  }
  const searchFilter: FilterLeaf = {
    properties_copy_v2: {
      value: {
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

/**
 * Retrieves property parameters based on the provided organization ID, property, and search criteria.
 * @param org_id The ID of the organization.
 * @param property The property to filter by.
 * @param search The search criteria.
 * @returns A promise that resolves to a Result object containing an array of PropertyParam objects if successful, or an error message if unsuccessful.
 */
export async function getPropertyParams(
  org_id: string,
  property: string,
  search: string
): Promise<Result<PropertyParam[], string>> {
  const builtFilter = await buildFilterWithAuthClickHouseProperties({
    org_id,
    filter: getFilterSearchFilterNode(property, search),
    argsAcc: [],
  });

  const query = `
  SELECT distinct key as property_key, value as property_param
  from properties_copy_v2
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
