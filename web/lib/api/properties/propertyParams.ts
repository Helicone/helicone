import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getPagination } from "../../../components/shared/getPagination";
import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";
import { Database } from "../../../supabase/database.types";

export interface PropertyParam {
  property_param: string;
}

export async function getPropertyParams(
  user_id: string
): Promise<Result<PropertyParam[], string>> {
  const query = `
SELECT DISTINCT properties->>keys AS property_param
FROM request r
JOIN user_api_keys u ON r.auth_hash = u.api_key_hash
CROSS JOIN LATERAL jsonb_object_keys(properties) keys
WHERE (u.user_id = '${user_id}');`;

  const { data, error } = await dbExecute<PropertyParam>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
