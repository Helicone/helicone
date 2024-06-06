import generateApiKey from "generate-api-key";
import { getJawnClient } from "../lib/clients/jawn";

export function generateAPIKeyHelper(
  permission: "rw" | "w",
  organization_type: string,
  userId: string,
  keyName: string,
  isEu: boolean
) {
  const apiKeyPrefix = permission === "rw" ? "sk" : "pk";

  const apiKey = `${apiKeyPrefix}-helicone${isEu ? "-eu" : ""}${
    organization_type === "customer" ? "-cp" : ""
  }-${generateApiKey({
    method: "base32",
    dashes: true,
  }).toString()}`.toLowerCase();

  const jawn = getJawnClient();
  return {
    res: jawn.POST("/v1/key/generateHash", {
      body: {
        apiKey,
        userId: userId,
        keyName: keyName.value,
        permissions: permission,
      },
    }),
    apiKey: apiKey,
  };
}
