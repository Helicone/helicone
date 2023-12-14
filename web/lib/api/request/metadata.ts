import { dbExecute } from "../db/dbExecute";
import { Result } from "../../result";

/**
 * Represents the metadata associated with a request.
 */
export interface RequestMetaData {
  request_id: string;
  cached_created_at: string;
}

/**
 * Retrieves the metadata for a specific request.
 * @param user_id - The ID of the user making the request.
 * @param request_id - The ID of the request.
 * @returns A promise that resolves to a Result object containing the request metadata or an error message.
 */
export async function getRequestMetaData(
  user_id: string,
  request_id: string
): Promise<Result<RequestMetaData[], string>> {
  //assert request_id is a uuid
  if (
    !request_id.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  ) {
    return { data: null, error: "Invalid request_id" };
  }
  const query = `
  SELECT cache_hits.created_at as cached_created_at,
    cache_hits.request_id as request_id
  FROM request
    left join cache_hits on request.id = cache_hits.request_id
    left join user_api_keys on user_api_keys.api_key_hash = request.auth_hash
  WHERE (
    user_api_keys.user_id = '${user_id}'
    AND request.id = '${request_id}'
    AND cache_hits.created_at IS NOT NULL
  )
`;

  const { data, error } = await dbExecute<RequestMetaData>(query, []);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
