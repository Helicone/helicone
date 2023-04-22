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
  // The new query once the backfill/migration is complete
  //   const query = `
  // SELECT DISTINCT key AS property
  // FROM properties p
  // JOIN user_api_keys u ON p.auth_hash = u.api_key_hash
  // WHERE (u.user_id = '${user_id}');`;

  const query = `
  SELECT DISTINCT keys AS property
  FROM request r
  JOIN user_api_keys u ON r.auth_hash = u.api_key_hash
  CROSS JOIN LATERAL jsonb_object_keys(properties) keys
  WHERE (u.user_id = '${user_id}');`;

  const { data, error } = await dbExecute<Property>(query, []);

  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
