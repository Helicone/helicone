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
import { JawnAuthenticatedRequest } from "../../types/request";
import { KeyManager } from "../../managers/apiKeys/KeyManager";

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

    return result.data;
  }

  @Post("/provider-key")
  public async createProviderKey(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      providerName: string;
      providerKey: string;
      providerKeyName: string;
    }
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.createProviderKey({
      providerName: body.providerName,
      providerKeyName: body.providerKeyName,
      providerKey: body.providerKey,
    });

    if (result.error) {
      this.setStatus(500);
      return { error: result.error };
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
    @Body() body: { providerKey?: string }
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.updateProviderKey({
      providerKeyId,
      providerKey: body.providerKey,
    });

    if (result.error) {
      this.setStatus(500);
      return { error: result.error };
    }

    return result.data;
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

    if (result.error) {
      this.setStatus(500);
      return { error: result.error };
    }

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
    @Path() apiKeyId: string
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.deleteAPIKey(apiKeyId);

    if (result.error) {
      this.setStatus(500);
      return { error: result.error };
    }

    return result.data;
  }

  @Patch("/{apiKeyId}")
  public async updateAPIKey(
    @Request() request: JawnAuthenticatedRequest,
    @Path() apiKeyId: string,
    @Body() body: { api_key_name: string }
  ) {
    const keyManager = new KeyManager(request.authParams);
    const result = await keyManager.updateAPIKey(apiKeyId, {
      api_key_name: body.api_key_name,
    });

    if (result.error) {
      this.setStatus(500);
      return { error: result.error };
    }

    return result.data;
  }
}
