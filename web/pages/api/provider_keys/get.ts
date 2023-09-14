import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { DecryptedProviderKey } from "../../../services/lib/keys";
import { Role } from "../../../services/lib/user";
import { getDecryptedProviderKeysByOrgId } from "../../../services/lib/keys";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<DecryptedProviderKey[], string>>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { data: keys, error } = await getDecryptedProviderKeysByOrgId(
    supabaseServer,
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
