import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { hashAuth } from "../../../lib/hashClient";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { HeliconeProxyKeys } from "../../../services/lib/keys";
import { Permission } from "../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<HeliconeProxyKeys, string>>) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { providerKeyId, heliconeProxyKeyName, heliconeProxyKey } =
    req.body as {
      providerKeyId: string;
      heliconeProxyKeyName: string;
      heliconeProxyKey: string;
    };

  if (providerKeyId === undefined) {
    res.status(500).json({ error: "Invalid providerKeyId", data: null });
    return;
  }

  if (heliconeProxyKeyName === undefined) {
    res.status(500).json({ error: "Invalid heliconeProxyKeyName", data: null });
    return;
  }

  if (heliconeProxyKey === undefined) {
    res.status(500).json({ error: "Invalid heliconeProxyKey", data: null });
    return;
  }

  const heliconeProxyKeyHash = await hashAuth(heliconeProxyKey);

  const providerKey = await supabaseServer
    .from("provider_keys")
    .select("*")
    .eq("org_id", userData.orgId)
    .eq("id", providerKeyId)
    .single();

  if (providerKey.error !== null || providerKey.data === null) {
    console.error("Failed to retrieve provider key", providerKey.error);
    res.status(500).json({ error: providerKey.error.message, data: null });
    return;
  }

  // Constraint prevents provider key mapping twice to same helicone proxy key
  // e.g. HeliconeKey1 can't map to OpenAIKey1 and OpenAIKey2
  const newProxyMapping = await supabaseServer
    .from("helicone_proxy_keys")
    .insert({
      org_id: userData.orgId,
      helicone_proxy_key_name: heliconeProxyKeyName,
      helicone_proxy_key: heliconeProxyKeyHash,
      provider_key_id: providerKey.data.id,
    })
    .select("*")
    .single();

  if (newProxyMapping.error !== null) {
    console.error("Failed to insert proxy key mapping", newProxyMapping.error);
    res.status(500).json({ error: newProxyMapping.error.message, data: null });
    return;
  }

  if (newProxyMapping.data === null) {
    console.error("Failed to insert proxy key mapping, no data returned");
    res
      .status(500)
      .json({
        error: "Failed to insert proxy key mapping, no data returned",
        data: null,
      });
    return;
  }

  res.status(200).json({ error: null, data: newProxyMapping.data });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
