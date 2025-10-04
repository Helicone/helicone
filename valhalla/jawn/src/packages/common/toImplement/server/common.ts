import { KeyPermissions } from "../../auth/types";
import { dbExecute } from "../../../../lib/shared/db/dbExecute";
import { hashAuth } from "../../../../utils/hash";
import { AuthResult } from "../../auth/types";
import { err, ok } from "../../result";

export async function authenticateBearer(bearer: string): Promise<AuthResult> {
  const hashedBearer = await hashAuth(bearer.replace("Bearer ", ""));
  let apiKey = await dbExecute<{
    id: number;
    user_id: string;
    organization_id: string;
    tier: string;
    key_permissions: string;
  }>(
    `SELECT 
        helicone_api_keys.id, 
        helicone_api_keys.user_id, 
        helicone_api_keys.organization_id, 
        organization.tier as tier,
        helicone_api_keys.key_permissions
    FROM helicone_api_keys INNER JOIN organization ON helicone_api_keys.organization_id = organization.id WHERE helicone_api_keys.api_key_hash = $1 AND helicone_api_keys.soft_delete = false`,
    [hashedBearer],
  );

  if (apiKey.error) {
    return err(JSON.stringify(apiKey.error));
  }

  // I dont know how we are getting in this case... but we are in some cases - Justin (2023)
  if (apiKey.data?.length === 0) {
    const hashedBearer2 = await hashAuth(bearer);
    apiKey = await dbExecute<{
      id: number;
      user_id: string;
      organization_id: string;
      tier: string;
      key_permissions: string;
    }>(
      `SELECT 
        helicone_api_keys.id, 
        helicone_api_keys.user_id, 
        helicone_api_keys.organization_id, 
        organization.tier as tier,
        helicone_api_keys.key_permissions
      FROM helicone_api_keys INNER JOIN organization ON helicone_api_keys.organization_id = organization.id WHERE helicone_api_keys.api_key_hash = $1 AND helicone_api_keys.soft_delete = false`,
      [hashedBearer2],
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
    tier: apiKey.data?.[0]?.tier ?? "free",
  });
}
