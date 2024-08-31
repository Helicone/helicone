import {
  Route,
  Tags,
  Security,
  Controller,
  Body,
  Post,
  Get,
  Request,
  Path,
  Patch,
} from "tsoa";
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  DecryptedProviderKey,
  VaultManager,
} from "../../managers/VaultManager";

export interface AddVaultKeyParams {
  key: string;
  provider: string;
  name?: string;
}

@Route("v1/vault")
@Tags("Vault")
@Security("api_key")
export class VaultController extends Controller {
  @Post("add")
  public async addKey(
    @Body() requestBody: AddVaultKeyParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ id: string }, string>> {
    if (
      !(
        request.authParams.role === "admin" ||
        request.authParams.role === "owner"
      )
    ) {
      this.setStatus(403);
      return { data: null, error: "Forbidden" };
    }

    const vaultManager = new VaultManager(request.authParams);
    const result = await vaultManager.addKey(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(201);
    }
    return result;
  }

  @Get("keys")
  public async getKeys(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<DecryptedProviderKey[], string>> {
    if (
      !(
        request.authParams.role === "admin" ||
        request.authParams.role === "owner"
      )
    ) {
      this.setStatus(403);
      return { data: null, error: "Forbidden" };
    }
    const vaultManager = new VaultManager(request.authParams);
    const result = await vaultManager.getDecryptedProviderKeysByOrgId();
    if (result.error || !result.data) {
      this.setStatus(500);
      return { data: null, error: result.error || "Failed to retrieve keys" };
    }

    this.setStatus(200);
    return result;
  }

  @Get("key/{providerKeyId}")
  public async getKeyById(
    @Path() providerKeyId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<DecryptedProviderKey, string>> {
    if (
      !(
        request.authParams.role === "admin" ||
        request.authParams.role === "owner"
      )
    ) {
      this.setStatus(403);
      return { data: null, error: "Forbidden" };
    }

    const vaultManager = new VaultManager(request.authParams);

    const result = await vaultManager.getDecryptedProviderKeyById(
      providerKeyId
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return { data: null, error: result.error || "Failed to retrieve key" };
    }

    this.setStatus(200);
    return result;
  }

  @Patch("update/{id}")
  public async updateKey(
    @Path() id: string,
    @Body() requestBody: { key?: string; name?: string; active?: boolean },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    if (
      !(
        request.authParams.role === "admin" ||
        request.authParams.role === "owner"
      )
    ) {
      this.setStatus(403);
      return { data: null, error: "Forbidden" };
    }

    const vaultManager = new VaultManager(request.authParams);
    const result = await vaultManager.updateKey({ id, ...requestBody });
    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }
}
