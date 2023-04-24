import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getPagination } from "../../../components/shared/getPagination";
import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";
import { Database } from "../../../supabase/database.types";
import {
  buildFilterWithAuth,
  buildFilterWithAuthProperties,
} from "../../../services/lib/filters/filters";
import {
  FilterLeaf,
  FilterNode,
} from "../../../services/lib/filters/filterDefs";

export interface PropertyParam {
  property_param: string;
  property_key: string;
}

function getFilterSearchFilterNode(
  property: string,
  search: string
): FilterNode {
  const propertyFilter: FilterLeaf = {
    properties_table: {
      key: {
        equals: property,
      },
    },
  };
  if (search === "") {
    return propertyFilter;
  }
  const searchFilter: FilterLeaf = {
    properties_table: {
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

export async function getPropertyParams(
  user_id: string,
  property: string,
  search: string
): Promise<Result<PropertyParam[], string>> {
  const builtFilter = await buildFilterWithAuthProperties(
    user_id,
    getFilterSearchFilterNode(property, search)
  );

  const query = `
  SELECT distinct substring(key for 100) as property_key, substring(value for 100) as property_param
  from properties
  left join request on properties.request_id = request.id
  where (
    ${builtFilter.filter}
  )
  limit 100
`;
  console.log(query);
  console.log(builtFilter.argsAcc);

  const { data, error } = await dbExecute<PropertyParam>(
    query,
    builtFilter.argsAcc
  );

  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
