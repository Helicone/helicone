import generateApiKey from "generate-api-key";
import { getJawnClient } from "../lib/clients/jawn";

export function generateAPIKeyHelper(
  permission: "rw" | "w",
  organization_type: string,
  keyName: string,
  isEu: boolean,
  governance: boolean
) {
  const apiKeyPrefix = permission === "rw" ? "sk" : "pk";

  const apiKey = `${apiKeyPrefix}${
    organization_type === "customer" ? "" : "-helicone"
  }${isEu ? "-eu" : ""}${organization_type === "customer" ? "-cp" : ""}${
    governance ? "-gov" : ""
  }-${generateApiKey({
    method: "base32",
    dashes: true,
  }).toString()}`.toLowerCase();

  const jawn = getJawnClient();
  return {
    res: jawn.POST("/v1/key/generateHash", {
      body: {
        apiKey,
        keyName: keyName,
        permissions: permission,
        governance: governance,
      },
    }),
    apiKey: apiKey,
  };
}
