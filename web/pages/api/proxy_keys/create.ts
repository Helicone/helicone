import generateApiKey from "generate-api-key";
import { dbExecute } from "../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { HeliconeProxyKeys } from "../../../services/lib/keys";
import crypto from "crypto";
import { getDecryptedProviderKeyById } from "../../../services/lib/keys";
import { Database } from "../../../supabase/database.types";

type HashedPasswordRow = {
  hashed_password: string;
};

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<HeliconeProxyKeys, string>>) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { providerKeyId, heliconeProxyKeyName, limits } = req.body as {
    providerKeyId: string;
    heliconeProxyKeyName: string;
    limits: Database["public"]["Tables"]["helicone_proxy_key_limits"]["Insert"][];
  };

  if (providerKeyId === undefined) {
    res.status(500).json({ error: "Invalid providerKeyId", data: null });
    return;
  }

  if (heliconeProxyKeyName === undefined) {
    res.status(500).json({ error: "Invalid heliconeProxyKeyName", data: null });
    return;
  }

  const { data: providerKey, error } = await getDecryptedProviderKeyById(
    supabaseServer(),
    providerKeyId
  );

  if (error || !providerKey?.id) {
    console.error("Failed to retrieve provider key", error);
    res
      .status(500)
      .json({ error: error ?? "Failed to retrieve provider key", data: null });
    return;
  }

  // Generate a new proxy key
  const proxyKeyId = crypto.randomUUID();
  const proxyKey = `sk-helicone-proxy-${generateApiKey({
    method: "base32",
    dashes: true,
  }).toString()}-${proxyKeyId}`.toLowerCase();

  const query = `SELECT encode(pgsodium.crypto_pwhash_str($1), 'hex') as hashed_password;`;
  const hashedResult = await dbExecute<HashedPasswordRow>(query, [proxyKey]);

  if (
    hashedResult.error ||
    !hashedResult.data ||
    hashedResult.data.length === 0
  ) {
    res.status(500).json({
      error: hashedResult.error ?? "Failed to retrieve hashed api key",
      data: null,
    });
    return;
  }

  // Constraint prevents provider key mapping twice to same helicone proxy key
  // e.g. HeliconeKey1 can't map to OpenAIKey1 and OpenAIKey2
  const newProxyMapping = await supabaseServer()
    .from("helicone_proxy_keys")
    .insert({
      id: proxyKeyId,
      org_id: userData.orgId,
      helicone_proxy_key_name: heliconeProxyKeyName,
      helicone_proxy_key: hashedResult.data[0].hashed_password,
      provider_key_id: providerKey.id,
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
    res.status(500).json({
      error: "Failed to insert proxy key mapping, no data returned",
      data: null,
    });
    return;
  }

  newProxyMapping.data.helicone_proxy_key = proxyKey;

  if (limits.length > 0) {
    const insertLimits = await supabaseServer()
      .from("helicone_proxy_key_limits")
      .insert(
        limits.map((limit) => ({
          id: crypto.randomUUID(),
          helicone_proxy_key: proxyKeyId,
          timewindow_seconds: limit.timewindow_seconds,
          count: limit.count,
          cost: limit.cost,
          currency: limit.currency,
        }))
      );
    if (insertLimits.error) {
      const remove = await supabaseServer()
        .from("helicone_proxy_keys")
        .delete()
        .eq("id", proxyKeyId);
      console.error("Failed to insert limits, removing proxy key", remove);

      console.error("Failed to insert limits", insertLimits.error);
      res.status(500).json({ error: insertLimits.error.message, data: null });
      return;
    }
  }

  res.status(200).json({ error: null, data: newProxyMapping.data });
}

export default withAuth(handler);
