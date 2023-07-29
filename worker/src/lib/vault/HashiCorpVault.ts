import { Result } from "../../results";
import { IVault } from "./IVault";

class HashiCorpVault implements IVault {
  private endpoint: string;
  private token: string;

  constructor() {
    this.endpoint =
      process.env.HASHICORP_VAULT_ENDPOINT ?? "http://127.0.0.1:8200";
    this.token = process.env.HASHICORP_VAULT_TOKEN ?? "myroot";
  }

  async writeProviderKey(
    orgId: string,
    vaultKeyId: string,
    providerKey: string
  ): Promise<Result<null, string>> {
    const vaultPath = this.createProviderVaultPath(orgId, vaultKeyId);
    try {
      const response: Response = await fetch(
        this.endpoint + "/v1/" + vaultPath,
        {
          method: "POST",
          headers: {
            "X-Vault-Token": this.token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              value: providerKey,
            },
          }),
        }
      );

      if (!response.ok) throw new Error(await response.text());

      return { error: null, data: null };
    } catch (error: any) {
      console.error("Error writing to vault", error);
      return {
        error: error.message || "Unexpected error while writing to vault",
        data: null,
      };
    }
  }

  async readProviderKey(
    orgId: string,
    vaultKeyId: string
  ): Promise<Result<string | null, string>> {
    const vaultPath = this.createProviderVaultPath(orgId, vaultKeyId);
    try {
      const response: Response = await fetch(
        this.endpoint + "/v1/" + vaultPath,
        {
          headers: {
            "X-Vault-Token": this.token,
          },
        }
      );

      if (!response.ok) throw new Error(await response.text());

      const data: { data?: { data?: { value?: string } } } | null =
        await response.json();
      return { error: null, data: data?.data?.data?.value ?? null };
    } catch (error: any) {
      console.error("Error reading from vault", error);
      return {
        error: error.message || "Unexpected error while reading from vault",
        data: null,
      };
    }
  }

  private createProviderVaultPath(orgId: string, vaultKeyId: string): string {
    return `secret/data/providerKeys/${orgId}/${vaultKeyId}`;
  }
}

export default HashiCorpVault;
