import { dbExecute } from "../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { DecryptedProviderKeyMapping } from "../../../services/lib/keys";
import { Permission } from "../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
  vault,
}: HandlerWrapperOptions<Result<DecryptedProviderKeyMapping[], string>>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  if (vault === null) {
    res.status(500).json({ error: "Failed to connect to vault", data: null });
    return;
  }

  const query = `
  SELECT map.id, map.org_id, map.helicone_proxy_key_name, map.provider_key_id,
  key.provider_name, key.vault_key_id, key.provider_key_name
  FROM helicone_proxy_keys map
  INNER JOIN provider_keys key ON key.id = map.provider_key_id
  WHERE map.org_id = $1
  AND map.soft_delete = false
  AND key.soft_delete = false
  `;

  const keyMappings = await dbExecute<DecryptedProviderKeyMapping>(query, [
    userData.orgId,
  ]);

  if (keyMappings.error || !keyMappings.data) {
    res.status(500).json({ error: keyMappings.error, data: null });
    return;
  }

  if (keyMappings.data.length === 0) {
    res.status(200).json({ error: null, data: [] });
    return;
  }

  const decryptedKeys: DecryptedProviderKeyMapping[] = keyMappings.data.map(
    (keyData, index) => {
      const { vault_key_id: vaultKeyId, ...keyDataWithoutVaultKeyId } = keyData;
      return {
        ...keyDataWithoutVaultKeyId,
        provider_key: null,
      };
    }
  );

  res.status(200).json({ error: null, data: decryptedKeys });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
