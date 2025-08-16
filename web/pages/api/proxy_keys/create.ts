import crypto from "crypto";
import generateApiKey from "generate-api-key";
import { Database } from "../../../db/database.types";
import { dbExecute } from "../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result, resultMap } from "@/packages/common/result";
import {
  getDecryptedProviderKeyById,
  HeliconeProxyKeys,
} from "../../../services/lib/keys";
import { logger } from "@/lib/telemetry/logger";

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

  const { data: providerKey, error } =
    await getDecryptedProviderKeyById(providerKeyId);

  if (error || !providerKey?.id) {
    logger.error({ error, providerKeyId }, "Failed to retrieve provider key");
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
  const newProxyMapping = resultMap(
    await dbExecute<Database["public"]["Tables"]["helicone_proxy_keys"]["Row"]>(
      `INSERT INTO helicone_proxy_keys (id, org_id, helicone_proxy_key_name, helicone_proxy_key, provider_key_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        proxyKeyId,
        userData.orgId,
        heliconeProxyKeyName,
        hashedResult.data[0].hashed_password,
        providerKey.id,
      ],
    ),
    (data) => data?.[0],
  );

  if (newProxyMapping.error !== null) {
    logger.error(
      { error: newProxyMapping.error, proxyKeyId, providerKeyId },
      "Failed to insert proxy key mapping",
    );
    res.status(500).json({ error: newProxyMapping.error, data: null });
    return;
  }

  if (newProxyMapping.data === null) {
    logger.error(
      { proxyKeyId, providerKeyId },
      "Failed to insert proxy key mapping, no data returned",
    );
    res.status(500).json({
      error: "Failed to insert proxy key mapping, no data returned",
      data: null,
    });
    return;
  }

  newProxyMapping.data.helicone_proxy_key = proxyKey;

  if (limits.length > 0) {
    for (const limit of limits) {
      await dbExecute(
        `INSERT INTO helicone_proxy_key_limits (id, helicone_proxy_key, timewindow_seconds, count, cost, currency) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          proxyKeyId,
          limit.timewindow_seconds,
          limit.count,
          limit.cost,
          limit.currency,
        ],
      );
    }
  }

  res.status(200).json({ error: null, data: newProxyMapping.data });
}

export default withAuth(handler);
