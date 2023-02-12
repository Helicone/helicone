import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getPagination } from "../../../components/shared/getPagination";
import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";
import { Database } from "../../../supabase/database.types";

export interface Property {
  property: string;
}

export async function getProperties(
  user_id: string
): Promise<Result<Property[], string>> {
  const query = `
SELECT DISTINCT unnest(array_agg(keys)) as property
FROM (
  SELECT jsonb_object_keys(properties) AS keys
  FROM request r
  JOIN user_api_keys u ON r.auth_hash = u.api_key_hash
  WHERE (u.user_id = '${user_id}')
) subq;`;

  const { data, error } = await dbExecute<Property>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
