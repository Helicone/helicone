import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getPagination } from "../../../components/shared/getPagination";
import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";
import { Database } from "../../../supabase/database.types";
import { buildFilterWithAuthProperties } from "../../../services/lib/filters/filters";

export interface Property {
  property: string;
}

export async function getProperties(
  user_id: string
): Promise<Result<Property[], string>> {
  const builtFilter = await buildFilterWithAuthProperties(user_id);
  const query = `

  SELECT distinct key as property
  from properties
  left join request on properties.request_id = request.id
  where (
    ${builtFilter.filter}
  )
`;
  console.log(query);
  console.log(builtFilter.argsAcc);

  const { data, error } = await dbExecute<Property>(query, builtFilter.argsAcc);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
