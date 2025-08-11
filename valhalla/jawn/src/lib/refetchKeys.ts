import { ProviderName } from "@helicone-package/cost/models/providers";
import { Json } from "./db/database.types";
import { removeFromCache, storeInCache } from "./clients/cloudflareKV";
import { ENVIRONMENT } from "./clients/constant";

type ProviderKey = {
  provider: ProviderName;
  decrypted_provider_key: string;
  decrypted_provider_secret_key: string;
  auth_type: "key" | "session_token";
  config: Json | null;
  orgId: string;
};

export const MAX_RETRIES = 3;
async function setProviderKeyDev(
  providerKey: ProviderKey,
  retries = MAX_RETRIES
) {
  try {
    const res = await fetch(
      `${process.env.HELICONE_WORKER_API}/mock-set-provider-key`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: providerKey.provider,
          decryptedProviderKey: providerKey.decrypted_provider_key,
          decryptedProviderSecretKey: providerKey.decrypted_provider_secret_key,
          authType: providerKey.auth_type,
          config: providerKey.config,
          orgId: providerKey.orgId,
        }),
      }
    );
    if (!res.ok) {
      console.error(res);
      if (retries > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, 10_000 * (MAX_RETRIES - retries))
        );
        await setProviderKeyDev(providerKey, retries - 1);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

export async function setProviderKey(providerKey: ProviderKey) {
  if (ENVIRONMENT === "production") {
    await storeInCache(
      `provider_keys_${providerKey.provider}_${providerKey.orgId}`,
      JSON.stringify(providerKey)
    );
  } else {
    await setProviderKeyDev(providerKey);
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

export async function deleteProviderKey(
  providerName: ProviderName,
  orgId: string
) {
  if (ENVIRONMENT === "production") {
    await removeFromCache(`provider_keys_${providerName}_${orgId}`);
  } else {
    try {
      const res = await fetch(
        `${process.env.HELICONE_WORKER_API}/delete-provider-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ providerName, orgId }),
        }
      );
    } catch (e) {
      console.error(e);
    }
  }
}
