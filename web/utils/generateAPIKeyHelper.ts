import { getJawnClient } from "../lib/clients/jawn";

/**
 * Asks Jawn to create a Helicone API key. The key is generated server-side
 * and returned once in the response.
 */
export async function generateAPIKeyHelper(
  permission: "rw" | "w",
  keyName: string,
  isEu: boolean,
  governance: boolean,
  enableRateLimit?: boolean,
  orgId?: string,
): Promise<{ apiKey: string | null; error: string | null }> {
  const jawn = getJawnClient(orgId);
  const res = await jawn.POST("/v1/key/generateHash", {
    body: {
      keyName: keyName,
      permissions: permission,
      governance: governance,
      enableRateLimit: enableRateLimit ?? false,
      isEu,
    },
  });

  if (!res.response.ok || !res.data?.apiKey) {
    return {
      apiKey: null,
      error: res.data?.error?.message ?? "Failed to generate API key",
    };
  }

  return { apiKey: res.data.apiKey, error: null };
}
