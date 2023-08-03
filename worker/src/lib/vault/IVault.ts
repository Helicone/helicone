import { Result } from "../../results";

export interface IVault {
  readProviderKey(
    orgId: string,
    vaultKeyId: string
  ): Promise<Result<string | null, string>>;
}
