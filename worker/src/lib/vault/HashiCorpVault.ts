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

      if (!response.ok) {
        return {
          error: `Error reading from vault: ${response.statusText}`,
          data: null,
        };
      }

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
