import { dbExecute } from "../../../lib/shared/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/shared/result";
import { DecryptedProviderKeyMapping } from "../../../services/lib/keys";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<DecryptedProviderKeyMapping[], string>>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const query = `
  SELECT 
    map.id,
    map.org_id,
    map.helicone_proxy_key_name,
    map.provider_key_id,
    key.provider_name,
    key.vault_key_id,
    key.provider_key_name,
    (
      SELECT array_agg(row_to_json(h.*))
      FROM helicone_proxy_key_limits h
      WHERE h.helicone_proxy_key = map.id
    ) as limits
  FROM helicone_proxy_keys map
  INNER JOIN provider_keys key ON key.id = map.provider_key_id
  WHERE map.org_id = $1
  AND map.soft_delete = false
  AND key.soft_delete = false
  `;

  const { data: keyMappings, error } =
    await dbExecute<DecryptedProviderKeyMapping>(query, [userData.orgId]);

  if (error || !keyMappings) {
    res.status(500).json({ error: error, data: null });
    return;
  }

  res.status(200).json({ error: null, data: keyMappings });
}

export default withAuth(handler);
