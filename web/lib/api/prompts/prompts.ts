import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";

export interface Value {
  value: string;
}

export async function getPromptValues(
  user_id: string
): Promise<Result<Value[], string>> {
  const query = `
SELECT DISTINCT keys AS value
FROM request r
JOIN user_api_keys u ON r.auth_hash = u.api_key_hash
CROSS JOIN LATERAL jsonb_object_keys(prompt_values) keys
WHERE (u.user_id = '${user_id}');`;

  const { data, error } = await dbExecute<Value>(query, []);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
