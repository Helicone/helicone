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
}: HandlerWrapperOptions<Result<DecryptedProviderKey, string>>) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  if (vault === null) {
    res
      .status(500)
      .json({ error: "Failed to connect to vault. hello world", data: null });
    return;
  }

  const { providerName, providerKey, providerKeyName } = req.body as {
    providerName: string;
    providerKey: string;
    providerKeyName: string;
  };

  if (providerName === undefined) {
    res.status(500).json({ error: "Invalid providerName", data: null });
    return;
  }

  if (providerKey === undefined) {
    res.status(500).json({ error: "Invalid providerKey", data: null });
    return;
  }

  if (providerKeyName === undefined) {
    res.status(500).json({ error: "Invalid providerKeyName", data: null });
    return;
  }

  const vaultKeyId = crypto.randomUUID();

  const { error } = await vault.writeProviderKey(
    userData.orgId,
    vaultKeyId,
    providerKey
  );

  if (error !== null) {
    console.error("Failed to write provider key to vault", error);
    res.status(500).json({ error: error, data: null });
    return;
  }

  const key = await supabaseServer
    .from("provider_keys")
    .insert({
      org_id: userData.orgId,
      provider_name: providerName,
      provider_key_name: providerKeyName,
      vault_key_id: vaultKeyId,
    })
    .select("*")
    .single();

  if (key.error !== null || key.data === null) {
    console.error("Failed to insert provider key", key.error);
    res.status(500).json({ error: key.error.message, data: null });
    return;
  }

  res.status(200).json({
    data: {
      id: key.data.id,
      org_id: key.data.org_id,
      provider_key: providerKey,
      provider_name: key.data.provider_name,
      provider_key_name: key.data.provider_key_name,
    },
    error: null,
  });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
