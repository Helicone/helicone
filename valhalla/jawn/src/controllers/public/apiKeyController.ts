import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { KeyManager } from "../../managers/apiKeys/KeyManager";
import { setAPIKey } from "../../lib/refetchKeys";
import { dbProviderToProvider } from "@helicone-package/cost/models/provider-helpers";
import { err, isError, ok, Result } from "../../packages/common/result";

export type UpdateProviderKeyRequest = {
  providerKey?: string;
  providerSecretKey?: string;
  config?: Record<string, string>;
  byokEnabled?: boolean;
};

export type CreateProviderKeyRequest = {
  providerName: string;
  providerKey: string;
  providerSecretKey?: string;
  providerKeyName: string;
  byokEnabled: boolean;
  config: Record<string, string>;
};

@Route("v1/api-keys")
@Tags("API Key")
@Security("api_key")
export class ApiKeyController extends Controller {
  @Delete("/provider-key/{providerKeyId}")
  public async deleteProviderKey(
    @Request() request: JawnAuthenticatedRequest,
    @Path() providerKeyId: string
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.deleteProviderKey(providerKeyId);

    if (result.error) {
      this.setStatus(500);
      return { error: result.error };
    }

    if (result.data === null) {
      return { error: "Provider key not found" };
    }

    if (result.data.providerName) {
      keyManager.resetProviderKeysInGatewayCache().catch((error) => {
        console.error("error refetching provider keys", error);
      });
    }
    return result.data;
  }

  @Post("/provider-key")
  public async createProviderKey(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: CreateProviderKeyRequest
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.createProviderKey(body);

    if (isError(result)) {
      this.setStatus(500);
      return { error: result.error };
    }

    const providerName = dbProviderToProvider(body.providerName);

    if (providerName) {
      // Reset cache for multiple keys support
      keyManager.resetProviderKeysInGatewayCache().catch((error) => {
        console.error("error resetting provider keys cache", error);
      });
    }
    return result.data;
  }

  @Get("/provider-key/{providerKeyId}")
  public async getProviderKey(
    @Request() request: JawnAuthenticatedRequest,
    @Path() providerKeyId: string
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.getDecryptedProviderKeyById(providerKeyId);

    if (result.error) {
      this.setStatus(500);
      return { error: result.error };
    }

    // Return the decrypted key data directly
    return result.data;
  }

  @Get("/provider-keys")
  public async getProviderKeys(@Request() request: JawnAuthenticatedRequest) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.getProviderKeys();

    if (result.error) {
      this.setStatus(500);
      return { error: result.error };
    }

    return result.data;
  }


  @Patch("/provider-key/{providerKeyId}")
  public async updateProviderKey(
    @Request() request: JawnAuthenticatedRequest,
    @Path() providerKeyId: string,
    @Body()
    body: UpdateProviderKeyRequest
  ): Promise<Result<{ id: string; providerName: string }, string>> {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.updateProviderKey({
      providerKeyId,
      ...body,
    });

    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error);
    }

    const providerName = dbProviderToProvider(result.data.providerName);
    if (providerName) {
      // Reset cache for multiple keys support
      keyManager.resetProviderKeysInGatewayCache().catch((error) => {
        console.error("error resetting provider keys cache", error);
      });
    }
    return ok({ id: providerKeyId, providerName: result.data.providerName });
  }

  @Get("/")
  public async getAPIKeys(@Request() request: JawnAuthenticatedRequest) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.getAPIKeys();

    if (result.error) {
      this.setStatus(500);
    }

    return result;
  }

  @Post("/")
  public async createAPIKey(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: { api_key_name: string; key_permissions?: "rw" | "r" | "w" }
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.createNormalKey(
      body.api_key_name,
      body.key_permissions ?? "rw"
    );

    if (result.error || !result.data) {
      this.setStatus(500);
      return { error: result.error };
    }

    await setAPIKey(
      result.data.hashedKey,
      request.authParams.organizationId,
      false
    );

    return result.data;
  }

  @Post("/proxy-key")
  public async createProxyKey(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      providerKeyId: string;
      proxyKeyName: string;
    }
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.createProxyKey({
      providerKeyId: body.providerKeyId,
      proxyKeyName: body.proxyKeyName,
    });

    if (result.error) {
      this.setStatus(500);
      return { error: result.error };
    }

    return result.data;
  }

  @Delete("/{apiKeyId}")
  public async deleteAPIKey(
    @Request() request: JawnAuthenticatedRequest,
    @Path() apiKeyId: number
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.deleteAPIKey(apiKeyId);

    if (result.error || !result.data) {
      this.setStatus(500);
      return { error: result.error };
    }

    await setAPIKey(
      result.data.hashedKey,
      request.authParams.organizationId,
      true
    );

    return result.data;
  }

  @Patch("/{apiKeyId}")
  public async updateAPIKey(
    @Request() request: JawnAuthenticatedRequest,
    @Path() apiKeyId: number,
    @Body() body: { api_key_name: string }
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.updateAPIKey(apiKeyId, {
      api_key_name: body.api_key_name,
    });

    if (result.error || !result.data) {
      this.setStatus(500);
      return { error: result.error };
    }

    await setAPIKey(
      result.data.hashedKey,
      request.authParams.organizationId,
      false
    );

    return result.data;
  }
}
