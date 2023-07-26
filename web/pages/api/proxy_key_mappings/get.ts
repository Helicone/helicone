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

  const query = `
  SELECT map.id, map.org_id, map.helicone_proxy_key, map.helicone_proxy_key_name, map.provider_key_id,
  key.provider_name, key.vault_key_id
  FROM helicone_proxy_keys map
  INNER JOIN provider_keys key ON key.id = map.provider_key_id
  WHERE map.org_id = $1
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

  const promises = keyMappings.data.map((mapping) =>
    vault.readProviderKey(userData.orgId, mapping.vaultKeyId as string)
  );

  const keys: Result<string, string>[] = await Promise.all(promises);

  let errors: string[] = [];
  for (const key of keys) {
    if (key.error) {
      errors.push(key.error);
    }
  }

  if (errors.length > 0) {
    console.error("Failed to read provider keys from vault", errors);
    res.status(500).json({ error: errors.join(", "), data: null });
    return;
  }

  const decryptedKeys: DecryptedProviderKeyMapping[] = keyMappings.data.map(
    (keyData, index) => {
      const { vaultKeyId, ...keyDataWithoutVaultKeyId } = keyData;
      return {
        ...keyDataWithoutVaultKeyId,
        providerKey: keys[index]?.data || null,
      };
    }
  );

  res.status(200).json({ error: null, data: decryptedKeys });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
