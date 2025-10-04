import { Config } from "@helicone-package/llm-mapper/router-bindings";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";
import { AuthParams } from "../../packages/common/auth/types";

export async function getKeys(organizationId: string) {
  return await await dbExecute<{
    user_id: string;
    api_key_hash: string;
  }>(
    "SELECT user_id, api_key_hash FROM helicone_api_keys WHERE organization_id = $1 and soft_delete = false",
    [organizationId],
  );
}

export async function getConfig(params: {
  auth: AuthParams;
}): Promise<Result<Config, string>> {
  const keys = await getKeys(params.auth.organizationId);
  if (keys.error) {
    return err(keys.error);
  }

  return ok({
    auth: {
      organizationId: params.auth.organizationId,
      userId: params.auth.userId ?? "",
    },
    keys: keys.data!.map((key) => ({
      ownerId: key.user_id,
      keyHash: key.api_key_hash,
      organizationId: params.auth.organizationId,
    })),
    routerId: "router",
    routerConfig: "",
  });
}
