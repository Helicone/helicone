import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import {
  DecryptedProviderKey,
  getDecryptedProviderKeysByOrgId,
} from "../../../services/lib/keys";
import { Permission } from "../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<DecryptedProviderKey[], string>>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const decryptedKeys = await getDecryptedProviderKeysByOrgId(
    supabaseServer,
    userData.orgId
  );

  if (decryptedKeys.error !== null) {
    console.error(
      "Failed to retrieve decrypted provider keys",
      decryptedKeys.error
    );
    res.status(500).json({ error: decryptedKeys.error, data: null });
    return;
  }

  res.status(200).json({
    data: decryptedKeys.data,
    error: null,
  });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
