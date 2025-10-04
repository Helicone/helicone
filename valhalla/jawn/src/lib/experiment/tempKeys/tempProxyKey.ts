import { KeyManager } from "../../../managers/apiKeys/KeyManager";
import { dbExecute } from "../../shared/db/dbExecute";
import { Result, err, ok } from "../../../packages/common/result";
import { BaseTempKey } from "./baseTempKey";

type HashedPasswordRow = {
  hashed_password: string;
};

async function createProxyKey(
  providerKeyId: string,
  heliconeProxyKeyName: string,
  organizationId: string,
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
  constructor(
    private proxyKey: string,
    private proxyKeyId: string,
  ) {}

  async cleanup() {
    if (this.keyUsed) {
      return;
    }

    try {
      // Direct database access for cleanup
      return await dbExecute(
        `DELETE FROM helicone_proxy_keys
         WHERE id = $1
         AND experiment_use = true`,
        [this.proxyKeyId],
      );
    } catch (error) {
      console.error("Error cleaning up proxy key:", error);
      return { error: String(error) };
    }
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
  organizationId?: string,
): Promise<Result<TempProxyKey, string>> {
  // Get provider key details to determine organization ID if not provided
  if (!organizationId) {
    try {
      // Use direct database query to get organization ID
      const keyResult = await dbExecute<{ org_id: string }>(
        `SELECT org_id
         FROM decrypted_provider_keys_v2
         WHERE id = $1 
         AND soft_delete = false
         LIMIT 1`,
        [providerKeyId],
      );

      if (keyResult.error || !keyResult.data || keyResult.data.length === 0) {
        return err("Provider key not found or missing organization ID");
      }

      organizationId = keyResult.data[0].org_id;
    } catch (error) {
      console.error("Error getting provider key details:", error);
      return err(String(error));
    }
  }

  // Create the proxy key using the updated createProxyKey function
  const proxyKey = await createProxyKey(
    providerKeyId,
    heliconeProxyKeyName,
    organizationId,
  );

  if (!proxyKey?.data) {
    return err(proxyKey?.error || "Failed to create proxy key");
  } else {
    return ok(
      new TempProxyKey(proxyKey.data.proxyKey, proxyKey.data.proxyKeyId),
    );
  }
}
