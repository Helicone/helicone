import { Result } from "../../../lib/result";

export interface IVault {
  writeProviderKey(
    orgId: string,
    vaultKeyId: string,
    providerKey: string
  ): Promise<Result<null, string>>;

  readProviderKey(
    orgId: string,
    vaultKeyId: string
  ): Promise<Result<string, string>>;
}
