import { Result } from "../../results";

export interface IVault {
  writeProviderKey(
    orgId: string,
    vaultKeyId: string,
    providerKey: string
  ): Promise<Result<null, string>>;

  readProviderKey(
    orgId: string,
    vaultKeyId: string
  ): Promise<Result<string | null, string>>;
}
