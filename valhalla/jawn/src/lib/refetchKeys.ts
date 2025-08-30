import { type ModelProviderName } from "@helicone-package/cost/models/providers";
import { removeFromCache, storeInCache } from "./clients/cloudflareKV";
import { type Json } from "./db/database.types";
import { ENVIRONMENT } from "./clients/constant";

type ProviderKey = {
  provider: ModelProviderName;
  decrypted_provider_key: string;
  decrypted_provider_secret_key: string;
  auth_type: "key" | "session_token";
  config: Json | null;
  orgId: string;
  cuid?: string;
  byok_enabled?: boolean;
};

export const MAX_RETRIES = 3;

async function setProviderKeyDev(
  orgId: string,
  providerKeys: ProviderKey[],
  retries = MAX_RETRIES
) {
  try {
    const res = await fetch(
      `${process.env.HELICONE_WORKER_API}/mock-set-provider-keys/${orgId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          providerKeys.map((providerKey) => ({
            provider: providerKey.provider,
            decryptedProviderKey: providerKey.decrypted_provider_key,
            decryptedProviderSecretKey:
              providerKey.decrypted_provider_secret_key,
            authType: providerKey.auth_type,
            config: providerKey.config,
            orgId: providerKey.orgId,
            cuid: providerKey.cuid,
            byokEnabled: providerKey.byok_enabled,
          }))
        ),
      }
    );
    if (!res.ok) {
      console.error(res);
      if (retries > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, 10_000 * (MAX_RETRIES - retries))
        );
        await setProviderKeyDev(orgId, providerKeys, retries - 1);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

export async function setProviderKeys(
  orgId: string,
  providerKeys: ProviderKey[]
) {
  if (ENVIRONMENT === "production") {
    await storeInCache(`provider_keys_${orgId}`, JSON.stringify(providerKeys));
  } else {
    await setProviderKeyDev(orgId, providerKeys);
  }
}

export async function setAPIKey(
  apiKeyHash: string,
  organizationId: string,
  softDelete: boolean
) {
  if (ENVIRONMENT === "production") {
    if (softDelete) {
      await removeFromCache(`api_keys_${apiKeyHash}`);
    } else {
      await storeInCache(`api_keys_${apiKeyHash}`, organizationId);
    }
  } else {
    await setAPIKeyDev(apiKeyHash, organizationId, softDelete);
  }
}

export async function setAPIKeyDev(
  apiKeyHash: string,
  organizationId: string,
  softDelete: boolean,
  retries = MAX_RETRIES
) {
  try {
    const res = await fetch(
      `${process.env.HELICONE_WORKER_API}/mock-set-api-key`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKeyHash,
          organizationId,
          softDelete,
        }),
      }
    );
    if (!res.ok) {
      console.error(res);
      if (retries > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, 10_000 * (MAX_RETRIES - retries))
        );
        await setAPIKeyDev(apiKeyHash, organizationId, softDelete, retries - 1);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
