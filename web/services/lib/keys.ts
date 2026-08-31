import { dbExecute } from "@/lib/api/db/dbExecute";
import { Database } from "../../db/database.types";
import { Result, resultMap } from "@/packages/common/result";

export type DecryptedProviderKey = {
  id: string | null;
  org_id: string | null;
  provider_key: string | null;
  provider_name: string | null;
  provider_key_name: string | null;
};

export type HeliconeProxyKeys =
  Database["public"]["Tables"]["helicone_proxy_keys"]["Row"];

export type DecryptedProviderKeyMapping = DecryptedProviderKey &
  HeliconeProxyKeys & {
    limits: Database["public"]["Tables"]["helicone_proxy_key_limits"]["Row"][];
  };

export type AddKeyObj = {
  userId: string;
  apiKeyHash: string;
  apiKeyPreview: string;
  keyName: string;
};

async function getDecryptedProviderKeysByOrgId(
  orgId: string,
): Promise<Result<DecryptedProviderKey[], string>> {
  return resultMap(
    await dbExecute<{
      id: string;
      org_id: string;
      decrypted_provider_key: string;
      provider_name: string;
      provider_key_name: string;
    }>(
      `SELECT id, org_id, decrypted_provider_key, provider_key_name, provider_name from decrypted_provider_keys_v2 where org_id = $1 and soft_delete = false`,
      [orgId],
    ),
    (keys) =>
      keys.map((key) => ({
        id: key.id,
        org_id: key.org_id,
        provider_key: key.decrypted_provider_key,
        provider_name: key.provider_name,
        provider_key_name: key.provider_key_name,
      })),
  );
}

/**
 * Look up a provider key by id, scoped to the calling org. `orgId` is
 * required on purpose: a provider key id must never be resolvable across
 * tenants (CIRT-80). Resolves to `null` when no matching key exists.
 */
async function getDecryptedProviderKeyById(
  providerKeyId: string,
  orgId: string,
): Promise<Result<DecryptedProviderKey | null, string>> {
  return resultMap(
    await dbExecute<{
      id: string;
      org_id: string;
      decrypted_provider_key: string;
      provider_key_name: string;
      provider_name: string;
    }>(
      `SELECT id, org_id, decrypted_provider_key, provider_key_name, provider_name
       FROM decrypted_provider_keys_v2
       WHERE id = $1 AND org_id = $2 AND soft_delete = false
       LIMIT 1`,
      [providerKeyId, orgId],
    ),
    (rows) => {
      const key = rows?.[0];
      if (!key) return null;
      return {
        id: key.id,
        org_id: key.org_id,
        provider_key: key.decrypted_provider_key,
        provider_name: key.provider_name,
        provider_key_name: key.provider_key_name,
      };
    },
  );
}

export { getDecryptedProviderKeysByOrgId, getDecryptedProviderKeyById };
