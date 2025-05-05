import { KeyPermissions } from "../../auth/types";

import { Database } from "../../../../lib/db/database.types";
import { dbExecute } from "../../../../lib/shared/db/dbExecute";
import { hashAuth } from "../../../../utils/hash";
import { AuthResult } from "../../auth/types";
import { err, ok } from "../../result";

export async function authenticateBearer(bearer: string): Promise<AuthResult> {
  const hashedBearer = await hashAuth(bearer.replace("Bearer ", ""));
  let apiKey = await dbExecute<
    Database["public"]["Tables"]["helicone_api_keys"]["Row"]
  >(
    `SELECT * FROM helicone_api_keys WHERE api_key_hash = $1 AND soft_delete = false`,
    [hashedBearer]
  );

  if (apiKey.error) {
    return err(JSON.stringify(apiKey.error));
  }

  // I dont know how we are getting in this case... but we are in some cases - Justin (2023)
  if (apiKey.data?.length === 0) {
    const hashedBearer2 = await hashAuth(bearer);
    apiKey = await dbExecute<
      Database["public"]["Tables"]["helicone_api_keys"]["Row"]
    >(
      `SELECT * FROM helicone_api_keys WHERE api_key_hash = $1 AND soft_delete = false`,
      [hashedBearer2]
    );
  }

  if (apiKey.error) {
    return err(JSON.stringify(apiKey.error));
  }

  if (apiKey.data?.length === 0) {
    return err("No API key found");
  }

  return ok({
    organizationId: apiKey.data?.[0]?.organization_id ?? "",
    userId: apiKey.data?.[0]?.user_id ?? "",
    heliconeApiKeyId: apiKey.data?.[0]?.id ?? 0,
    keyPermissions: apiKey.data?.[0]?.key_permissions as KeyPermissions,
  });
}
