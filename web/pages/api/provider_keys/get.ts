import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../packages/common/result";
import {
  DecryptedProviderKey,
  getDecryptedProviderKeysByOrgId,
} from "../../../services/lib/keys";
import { Role } from "../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<DecryptedProviderKey[], string>>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { data: keys, error } = await getDecryptedProviderKeysByOrgId(
    userData.orgId
  );

  if (error || keys === null) {
    console.error("Failed to retrieve provider keys", error);
    res.status(500).json({ error: error, data: null });
    return;
  }

  if (userData.role === Role.MEMBER) {
    keys.forEach((key) => {
      key.provider_key = "";
    });
  }

  res.status(200).json({
    data: keys,
    error: null,
  });
}

export default withAuth(handler);
