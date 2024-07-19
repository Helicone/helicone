import generateApiKey from "generate-api-key";
import { supabaseServer } from "../../db/supabase";
import { Result, err, ok } from "../../shared/result";
import { uuid } from "uuidv4";
import { dbExecute } from "../../shared/db/dbExecute";
import { hashAuth } from "../../../utils/hash";
import { BaseTempKey } from "./baseTempKey";
type HashedPasswordRow = {
  hashed_password: string;
};

type DecryptedProviderKey = {
  id: string | null;
  org_id: string | null;
  provider_key: string | null;
  provider_name: string | null;
  provider_key_name: string | null;
};

async function getDecryptedProviderKeyById(
  providerKeyId: string
): Promise<Result<DecryptedProviderKey, string>> {
  const key = await supabaseServer.client
    .from("decrypted_provider_keys")
    .select(
      "id, org_id, decrypted_provider_key, provider_key_name, provider_name"
    )
    .eq("id", providerKeyId)
    .eq("soft_delete", false)
    .single();

  if (key.error !== null || key.data === null) {
    return { data: null, error: key.error.message };
  }

  const providerKey: DecryptedProviderKey = {
    id: key.data.id,
    org_id: key.data.org_id,
    provider_key: key.data.decrypted_provider_key,
    provider_name: key.data.provider_name,
    provider_key_name: key.data.provider_key_name,
  };

  return { data: providerKey, error: null };
}
async function createProxyKey(
  providerKeyId: string,
  heliconeProxyKeyName: string
) {
  if (providerKeyId === undefined) {
    return;
  }

  if (heliconeProxyKeyName === undefined) {
    return;
  }

  const { data: providerKey, error } = await getDecryptedProviderKeyById(
    providerKeyId
  );

  if (error || !providerKey?.id) {
    console.error("Failed to retrieve provider key", error);
    return;
  }

  // Generate a new proxy key
  const proxyKeyId = uuid();
  const proxyKey = `sk-helicone-proxy-${generateApiKey({
    method: "base32",
    dashes: true,
  }).toString()}-${proxyKeyId}`.toLowerCase();

  const query = `SELECT encode(pgsodium.crypto_pwhash_str($1), 'hex') as hashed_password;`;
  const hashedResult = await dbExecute<HashedPasswordRow>(query, [proxyKey]);

  if (
    hashedResult.error ||
    !hashedResult.data ||
    hashedResult.data.length === 0
  ) {
    return;
  }

  // Constraint prevents provider key mapping twice to same helicone proxy key
  // e.g. HeliconeKey1 can't map to OpenAIKey1 and OpenAIKey2
  if (!providerKey.org_id) {
    return;
  }
  const newProxyMapping = await supabaseServer.client
    .from("helicone_proxy_keys")
    .insert({
      id: proxyKeyId,
      org_id: providerKey.org_id,
      helicone_proxy_key_name: heliconeProxyKeyName,
      helicone_proxy_key: hashedResult.data[0].hashed_password,
      provider_key_id: providerKey.id,
      experiment_use: true,
    })
    .select("*")
    .single();

  return {
    data: {
      proxyKey,
      proxyKeyId: newProxyMapping?.data?.id ?? "",
    },
    error: null,
  };
}
class TempProxyKey implements BaseTempKey {
  private keyUsed = false;
  constructor(private proxyKey: string, private proxyKeyId: string) {}

  async cleanup() {
    if (this.keyUsed) {
      return;
    }
    return await supabaseServer.client
      .from("helicone_proxy_keys")
      .delete({
        count: "exact",
      })
      .eq("id", this.proxyKeyId)
      .eq("experiment_use", true);
  }

  async with<T>(callback: (proxyKey: string) => Promise<T>): Promise<T> {
    if (this.keyUsed) {
      throw new Error("Proxy key already used");
    }

    this.keyUsed = true;
    return callback(this.proxyKey)
      .then(async (t) => {
        await this.cleanup();
        return t;
      })
      .finally(async () => {
        await this.cleanup();
      });
  }
}

export async function generateProxyKey(
  providerKeyId: string,
  heliconeProxyKeyName: string
): Promise<Result<TempProxyKey, string>> {
  const proxyKey = await createProxyKey(providerKeyId, heliconeProxyKeyName);
  if (!proxyKey?.data) {
    return err("Failed to create proxy key");
  } else {
    return ok(
      new TempProxyKey(proxyKey.data.proxyKey, proxyKey.data.proxyKeyId)
    );
  }
}
