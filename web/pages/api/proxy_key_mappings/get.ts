import { DecryptedProviderKeyMapping } from "./../../../services/lib/keys";
import { dbExecute } from "../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { Permission } from "../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<DecryptedProviderKeyMapping[], string>>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const query = `
  SELECT map.id, map.org_id, map.helicone_proxy_key, map.helicone_proxy_key_name, map.provider_key_id,
  key.provider_name, key.decrypted_provider_key
  FROM proxy_key_mappings map
  INNER JOIN decrypted_provider_keys key ON key.id = map.provider_key_id
  WHERE map.org_id = $1
  `;

  const decryptedKeyMappings = await dbExecute<DecryptedProviderKeyMapping>(
    query,
    [userData.orgId]
  );

  if (decryptedKeyMappings.error || !decryptedKeyMappings.data) {
    res.status(500).json({ error: decryptedKeyMappings.error, data: null });
    return;
  }

  if (decryptedKeyMappings.data.length === 0) {
    res.status(200).json({ error: null, data: [] });
    return;
  }

  res.status(200).json({ error: null, data: decryptedKeyMappings.data });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
