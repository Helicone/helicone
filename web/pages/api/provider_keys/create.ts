import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import {
  DecryptedProviderKey,
  getDecryptedProviderKeyById,
} from "../../../services/lib/keys";
import { Permission } from "../../../services/lib/user";

async function handler({
  req,
  res,
  supabaseClient,
  userData,
}: HandlerWrapperOptions<Result<DecryptedProviderKey, string>>) {
  const client = supabaseClient.getClient();
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

  // insert provider key
  const key = await client
    .from("provider_keys")
    .insert({
      org_id: userData.orgId,
      provider_name: providerName,
      provider_key: providerKey,
      provider_key_name: providerKeyName,
    })
    .select("*")
    .single();

  if (key.error !== null || key.data === null) {
    console.error("Failed to insert proxy key", key.error);
    res.status(500).json({ error: key.error.message, data: null });
    return;
  }

  // Retrieve decrypted key
  const decryptedKey = await getDecryptedProviderKeyById(client, key.data.id);

  if (decryptedKey.error !== null) {
    console.error(
      "Failed to retrieve decrypted provider key",
      decryptedKey.error
    );
    res.status(500).json({ error: decryptedKey.error, data: null });
    return;
  }

  res.status(200).json({
    data: decryptedKey.data,
    error: null,
  });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
