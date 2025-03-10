import generateApiKey from "generate-api-key";
import { supabaseServer } from "../../db/supabase";
import { Result, err, ok } from "../../shared/result";
import { uuid } from "uuidv4";
import { dbExecute } from "../../shared/db/dbExecute";
import { hashAuth } from "../../../utils/hash";
import { BaseTempKey } from "./baseTempKey";
import { KeyManager } from "../../../managers/apiKeys/KeyManager";

type HashedPasswordRow = {
  hashed_password: string;
};

async function createProxyKey(
  providerKeyId: string,
  heliconeProxyKeyName: string,
  organizationId: string
) {
  if (!providerKeyId || !heliconeProxyKeyName) {
    return {
      data: null,
      error: "Missing required parameters",
    };
  }

  try {
    // Create KeyManager with the organization ID
    const keyManager = new KeyManager({
      userId: "",
      organizationId: organizationId,
    });

    // Create proxy key using the KeyManager
    const result = await keyManager.createProxyKey({
      providerKeyId,
      proxyKeyName: heliconeProxyKeyName,
      experimentUse: true,
    });

    if (result.error || !result.data) {
      return {
        data: null,
        error: result.error || "Failed to create proxy key",
      };
    }

    return {
      data: {
        proxyKey: result.data.proxyKey,
        proxyKeyId: result.data.proxyKeyId,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: `Failed to create proxy key: ${error}`,
    };
  }
}

class TempProxyKey implements BaseTempKey {
  private keyUsed = false;
  constructor(private proxyKey: string, private proxyKeyId: string) {}

  async cleanup() {
    if (this.keyUsed) {
      return;
    }

    // Direct database access for cleanup
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
  heliconeProxyKeyName: string,
  organizationId?: string
): Promise<Result<TempProxyKey, string>> {
  // Get provider key details to determine organization ID if not provided
  if (!organizationId) {
    // We can't use KeyManager.getDecryptedProviderKeyById because it's private
    // Use direct database query instead
    const key = await supabaseServer.client
      .from("decrypted_provider_keys")
      .select("org_id")
      .eq("id", providerKeyId)
      .eq("soft_delete", false)
      .single();

    if (key.error || !key.data?.org_id) {
      return err("Provider key not found or missing organization ID");
    }

    organizationId = key.data.org_id;
  }

  // Create the proxy key using the updated createProxyKey function
  const proxyKey = await createProxyKey(
    providerKeyId,
    heliconeProxyKeyName,
    organizationId
  );

  if (!proxyKey?.data) {
    return err(proxyKey?.error || "Failed to create proxy key");
  } else {
    return ok(
      new TempProxyKey(proxyKey.data.proxyKey, proxyKey.data.proxyKeyId)
    );
  }
}
