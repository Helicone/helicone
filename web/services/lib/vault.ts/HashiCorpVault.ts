import NodeVault from "node-vault";
import { IVault } from "./IVault";
import { Result } from "../../../lib/result";

class HashiCorpVault implements IVault {
  private vault: NodeVault.client;

  constructor() {
    const options = {
      apiVersion: "v1",
      endpoint: process.env.HASHICORP_VAULT_ENDPOINT ?? "http://127.0.0.1:8200",
      token: process.env.HASHICORP_VAULT_TOKEN ?? "myroot",
    };
    this.vault = NodeVault(options);
  }

  async writeProviderKey(
    orgId: string,
    vaultKeyId: string,
    providerKey: string
  ): Promise<Result<null, string>> {
    const vaultPath = this.createProviderVaultPath(orgId, vaultKeyId);
    try {
      await this.vault.write(vaultPath, {
        data: {
          value: providerKey,
        },
      });

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
  ): Promise<Result<string, string>> {
    const vaultPath = this.createProviderVaultPath(orgId, vaultKeyId);
    try {
      const data = await this.vault.read(vaultPath);
      return { error: null, data: data.data?.data?.value ?? "" };
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
