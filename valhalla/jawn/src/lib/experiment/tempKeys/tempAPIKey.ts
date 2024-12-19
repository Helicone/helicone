import generateApiKey from "generate-api-key";
import { hashAuth } from "../../../utils/hash";
import { supabaseServer } from "../../db/supabase";
import { Result, err, ok } from "../../shared/result";
import { BaseTempKey } from "./baseTempKey";

async function getHeliconeApiKey() {
  const apiKey = `sk-${generateApiKey({
    method: "base32",
    dashes: true,
  }).toString()}`.toLowerCase();
  return apiKey;
}

class TempHeliconeAPIKey implements BaseTempKey {
  private keyUsed = false;
  constructor(private apiKey: string, private heliconeApiKeyId: number) {}

  async cleanup() {
    if (this.keyUsed) {
      return;
    }
    await supabaseServer.client
      .from("helicone_api_keys")
      .update({
        soft_delete: true,
      })
      .eq("id", this.heliconeApiKeyId);
    return await supabaseServer.client
      .from("helicone_api_keys")
      .delete({
        count: "exact",
      })
      .eq("id", this.heliconeApiKeyId);
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
  keyPermissions?: "rw" | "r" | "w"
): Promise<
  Result<
    {
      apiKey: string;
      heliconeApiKeyId: number;
    },
    string
  >
> {
  const apiKey = await getHeliconeApiKey();
  const organization = await supabaseServer.client
    .from("organization")
    .select("*")
    .eq("id", organizationId)
    .single();

  const res = await supabaseServer.client
    .from("helicone_api_keys")
    .insert({
      api_key_hash: await hashAuth(apiKey),
      user_id: organization.data?.owner ?? "",
      api_key_name: keyName ?? "auto-generated-experiment-key",
      organization_id: organizationId,
      key_permissions: keyPermissions ?? "w",
    })
    .select("*")
    .single();

  if (res?.error || !res.data?.id) {
    return err("Failed to create apiKey key");
  } else {
    return ok({
      apiKey: apiKey,
      heliconeApiKeyId: res.data.id,
    });
  }
}

export async function generateTempHeliconeAPIKey(
  organizationId: string,
  keyName?: string
): Promise<Result<TempHeliconeAPIKey, string>> {
  const apiKey = await generateHeliconeAPIKey(organizationId, keyName);

  if (apiKey.error) {
    return err(apiKey.error);
  } else {
    return ok(
      new TempHeliconeAPIKey(apiKey.data!.apiKey, apiKey.data!.heliconeApiKeyId)
    );
  }
}
