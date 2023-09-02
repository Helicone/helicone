import { IVault } from "./IVault";
import { Result } from "../../../lib/result";

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
    keyValue: string
  ): Promise<Result<null, string>> {
    const namespaceResult = await this.ensureNamespaceExists(orgId);
    if (namespaceResult.error) {
      return namespaceResult;
    }

    const vaultPath = this.createProviderVaultPath(vaultKeyId);
    try {
      const response: Response = await fetch(
        this.endpoint + "/v1/" + vaultPath,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Vault-Token": this.token,
            "X-Vault-Namespace": `admin/helicone-vault/${orgId}`,
          },
          body: JSON.stringify({
            data: {
              value: keyValue,
            },
          }),
        }
      );

      if (!response.ok) {
        return {
          error: `Error writing to vault: ${response.statusText}`,
          data: null,
        };
      }

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
    const namespaceResult = await this.ensureNamespaceExists(orgId);
    if (namespaceResult.error) {
      return namespaceResult;
    }

    const vaultPath = this.createProviderVaultPath(vaultKeyId);
    try {
      const response: Response = await fetch(
        this.endpoint + "/v1/" + vaultPath,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Vault-Token": this.token,
            "X-Vault-Namespace": `admin/helicone-vault/${orgId}`,
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

  private async ensureNamespaceExists(
    orgId: string
  ): Promise<Result<null, string>> {
    try {
      const response: Response = await fetch(
        `${this.endpoint}/v1/sys/namespaces/${orgId}`,
        {
          headers: {
            "X-Vault-Namespace": "admin/helicone-vault",
            "X-Vault-Token": this.token,
          },
          method: "GET",
        }
      );

      if (response.ok) {
        return { error: null, data: null };
      }

      // If the namespace doesn't exist, create it
      if (response.status === 404) {
        const createResponse: Response = await fetch(
          `${this.endpoint}/v1/sys/namespaces/${orgId}`,
          {
            method: "POST",
            headers: {
              "X-Vault-Namespace": "admin/helicone-vault",
              "X-Vault-Token": this.token,
            },
          }
        );

        if (!createResponse.ok) {
          return {
            error: `Error creating namespace: ${createResponse.statusText}`,
            data: null,
          };
        }

        const createSecretEngineResponse: Response = await fetch(
          `${this.endpoint}/v1/sys/mounts/secret`,
          {
            method: "POST",
            headers: {
              "X-Vault-Namespace": `admin/helicone-vault/${orgId}`,
              "X-Vault-Token": this.token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ type: "kv-v2" }),
          }
        );

        if (!createSecretEngineResponse.ok) {
          return {
            error: `Error creating secret engine: ${createSecretEngineResponse.statusText}`,
            data: null,
          };
        }

        return { error: null, data: null };
      }

      return {
        error: `Error reading namespace: ${response.statusText}`,
        data: null,
      };
    } catch (error: any) {
      console.error("Error ensuring namespace exists", error);
      return {
        error: error.message || "Unexpected error while ensuring namespace",
        data: null,
      };
    }
  }

  private createProviderVaultPath(vaultKeyId: string): string {
    return `secret/data/providerKeys/${vaultKeyId}`;
  }
}

export default HashiCorpVault;
