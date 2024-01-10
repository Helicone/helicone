import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/shared/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { DecryptedProviderKey } from "../../../services/lib/keys";
import { Permission } from "../../../services/lib/user";
import crypto from "crypto";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<DecryptedProviderKey, string>>) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", data: null });
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

  const keyId = crypto.randomUUID();
  const { error } = await supabaseServer.from("provider_keys").insert({
    id: keyId,
    org_id: userData.orgId,
    provider_name: providerName,
    provider_key_name: providerKeyName,
    provider_key: providerKey,
  });

  if (error) {
    console.error("Failed to insert provider key", error.message);
    res.status(500).json({ error: error.message, data: null });
    return;
  }

  res.status(200).json({
    data: {
      id: keyId,
      org_id: userData.orgId,
      provider_key: providerKey,
      provider_name: providerName,
      provider_key_name: providerKeyName,
    },
    error: null,
  });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
