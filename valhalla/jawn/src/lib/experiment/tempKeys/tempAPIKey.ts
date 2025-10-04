import { KeyManager } from "../../../managers/apiKeys/KeyManager";
import { cacheResultCustom } from "../../../utils/cacheResult";
import { KVCache } from "../../cache/kvCache";
import { Result, err, ok } from "../../../packages/common/result";
import { BaseTempKey } from "./baseTempKey";
import { dbExecute } from "../../shared/db/dbExecute";
import { GET_KEY } from "../../clients/constant";

const CACHE_TTL = 60 * 1000 * 30; // 30 minutes

const kvCache = new KVCache(CACHE_TTL);

class TempHeliconeAPIKey implements BaseTempKey {
  private keyUsed = false;
  constructor(
    private apiKey: string,
    private heliconeApiKeyId: string,
  ) {}

  async cleanup() {
    if (this.keyUsed) {
      return;
    }

    await dbExecute(
      `UPDATE helicone_api_keys
       SET soft_delete = true
       WHERE temp_key = true
       AND created_at < $1`,
      [new Date(Date.now() - CACHE_TTL).toISOString()],
    );
  }

  async with<T>(callback: (apiKey: string) => Promise<T>): Promise<T> {
    if (this.keyUsed) {
      throw new Error("Key already used");
    }

    this.keyUsed = true;
    return callback(this.apiKey)
      .then(async (t) => {
        await this.cleanup();
        return t;
      })
      .finally(async () => {
        await this.cleanup();
      });
  }
}

export async function generateHeliconeAPIKey(
  organizationId: string,
  keyName?: string,
  keyPermissions?: "rw" | "r" | "w",
): Promise<
  Result<
    {
      apiKey: string;
      heliconeApiKeyId: string;
    },
    string
  >
> {
  try {
    // Create a KeyManager with the necessary auth params
    const keyManager = new KeyManager({
      userId: "", // This will be replaced by the org owner
      organizationId: organizationId,
    });

    // Use the KeyManager to create a temporary key
    const result = await keyManager.createTempKey(
      keyName ?? "auto-generated-experiment-key",
      keyPermissions ?? "w",
    );

    if (result.error || !result.data) {
      return err(result.error || "Failed to create API key");
    }

    return ok({
      apiKey: result.data.apiKey,
      heliconeApiKeyId: result.data.id,
    });
  } catch (error) {
    return err(`Failed to generate Helicone API Key: ${error}`);
  }
}

export async function generateTempHeliconeAPIKey(
  organizationId: string,
  keyName?: string,
): Promise<Result<TempHeliconeAPIKey, string>> {
  const apiKey = await cacheResultCustom(
    "generateTempHeliconeAPIKey-" + organizationId + (keyName ?? ""),
    async () => await generateHeliconeAPIKey(organizationId, keyName),
    kvCache,
  );

  if (apiKey.error) {
    return err(apiKey.error);
  } else {
    return ok(
      new TempHeliconeAPIKey(
        apiKey.data!.apiKey,
        apiKey.data!.heliconeApiKeyId,
      ),
    );
  }
}

class HeliconeDefaultTempKey {
  constructor(private apiKey: string) {}

  with<T>(callback: (apiKey: string) => Promise<T>): Promise<T> {
    return callback(this.apiKey);
  }
}

export async function getHeliconeDefaultTempKey(
  orgId: string,
): Promise<Result<HeliconeDefaultTempKey, string>> {
  const apiKey = await GET_KEY("key:helicone_on_helicone_key");
  if (apiKey.error) {
    return err(`Failed to get Helicone default temp key: ${apiKey.error}`);
  }
  return ok(new HeliconeDefaultTempKey(apiKey));
}
