import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";

export interface ValueParam {
  value_param: string;
  value_key: string;
}

/**
 * Retrieves the value parameters for a given user.
 * @param user_id - The ID of the user.
 * @returns A promise that resolves to a Result object containing the value parameters or an error message.
 */
export async function getValueParams(
  user_id: string
): Promise<Result<ValueParam[], string>> {
  const query = `
SELECT DISTINCT prompt_values->>keys AS value_param,
keys AS value_key
FROM request r
JOIN user_api_keys u ON r.auth_hash = u.api_key_hash
CROSS JOIN LATERAL jsonb_object_keys(prompt_values) keys
WHERE (u.user_id = '${user_id}')
LIMIT 1000;`;

  const { data, error } = await dbExecute<ValueParam>(query, []);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
