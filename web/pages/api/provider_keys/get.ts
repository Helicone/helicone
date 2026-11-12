import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "@/packages/common/result";
import {
  DecryptedProviderKey,
  getDecryptedProviderKeysByOrgId,
} from "../../../services/lib/keys";
import { Role } from "../../../services/lib/user";
import { logger } from "@/lib/telemetry/logger";
import { maskProviderSecret } from "@/lib/api/security/maskProviderSecret";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<DecryptedProviderKey[], string>>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", data: null });
    return;
  }

  const { data: keys, error } = await getDecryptedProviderKeysByOrgId(
    userData.orgId,
  );

  if (error || keys === null) {
    logger.error({ error }, "Failed to retrieve provider keys");
    res
      .status(500)
      .json({ error: "Failed to retrieve provider keys", data: null });
    return;
  }

  // Provider keys are customer secrets: this endpoint never returns them in
  // plaintext, to any role. Owners/admins get a masked hint (same format as
  // Jawn's maskProviderSecret), members get nothing.
  const isMember = userData.role === Role.MEMBER;
  const maskedKeys: DecryptedProviderKey[] = keys.map((key) => ({
    ...key,
    provider_key: isMember ? "" : (maskProviderSecret(key.provider_key) ?? ""),
  }));

  res.status(200).json({
    data: maskedKeys,
    error: null,
  });
}

export default withAuth(handler);
