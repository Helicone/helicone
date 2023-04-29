import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getPagination } from "../../../components/shared/getPagination";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";
import { Result } from "../../result";
import { Database } from "../../../supabase/database.types";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickhouseProperties,
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
    properties_copy_v1: {
      key: {
        equals: property,
      },
    },
  };
  if (search === "") {
    return propertyFilter;
  }
  const searchFilter: FilterLeaf = {
    properties_copy_v1: {
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
  const builtFilter = await buildFilterWithAuthClickhouseProperties({
    user_id,
    filter: getFilterSearchFilterNode(property, search),
    argsAcc: [],
  });

  const query = `
  SELECT distinct key as property_key, value as property_param
  from properties_copy_v1
  where (
    ${builtFilter.filter}
  )
  limit 100
`;
  console.log(query);

  const { data, error } = await dbQueryClickhouse<PropertyParam>(
    query,
    builtFilter.argsAcc
  );
  console.log(data, error);

  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
