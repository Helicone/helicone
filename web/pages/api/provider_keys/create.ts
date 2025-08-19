import { dbExecute } from "@/lib/api/db/dbExecute";
import crypto from "crypto";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "@/packages/common/result";
import { DecryptedProviderKey } from "../../../services/lib/keys";
import { Permission } from "../../../services/lib/user";
import { logger } from "@/lib/telemetry/logger";

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

  const { error } = await dbExecute(
    `INSERT INTO provider_keys (id, org_id, provider_name, provider_key_name, provider_key) VALUES ($1, $2, $3, $4, $5)`,
    [keyId, userData.orgId, providerName, providerKeyName, providerKey],
  );

  if (error) {
    logger.error({ error }, "Failed to insert provider key");
    res.status(500).json({ error: error, data: null });
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
