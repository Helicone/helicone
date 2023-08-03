import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { DecryptedProviderKey } from "../../../services/lib/keys";
import { Permission } from "../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
  vault,
}: HandlerWrapperOptions<Result<DecryptedProviderKey[], string>>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  if (vault === null) {
    res.status(500).json({ error: "Failed to connect to vault", data: null });
    return;
  }

  const keyIds = await supabaseServer
    .from("provider_keys")
    .select("*")
    .eq("org_id", userData.orgId)
    .eq("soft_delete", false);

  if (keyIds.error !== null) {
    console.error("Failed to retrieve provider keys", keyIds.error);
    res.status(500).json({ error: keyIds.error.message, data: null });
    return;
  }

  const promises = keyIds.data.map(({ vault_key_id: vaultKeyId }) =>
    vault.readProviderKey(userData.orgId, vaultKeyId)
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

  const decryptedKeys: DecryptedProviderKey[] = keyIds.data.map(
    (keyData, index) => {
      return {
        id: keyData.id,
        org_id: keyData.org_id,
        provider_key: keys[index]?.data || null,
        provider_name: keyData.provider_name,
        provider_key_name: keyData.provider_key_name,
      };
    }
  );

  res.status(200).json({
    data: decryptedKeys,
    error: null,
  });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
