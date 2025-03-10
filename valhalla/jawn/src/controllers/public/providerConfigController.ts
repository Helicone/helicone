import {
  Controller,
  Route,
  Security,
  Tags,
  Request,
  Get,
  Post,
  Delete,
  Path,
  Body,
} from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { ProviderConfigManager } from "../../managers/provider/ProviderConfigManager";
import { Result } from "../../lib/shared/result";

interface ProviderConfigurationResponse {
  id: string;
  provider_name: string;
  provider_configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
  provider_keys?: Array<{
    id: string;
    provider_name: string;
    provider_key_name: string;
    provider_configuration_id: string;
  }>;
}

interface UpsertProviderConfigRequest {
  provider_name: string;
  provider_configuration: Record<string, any>;
}

@Route("v1/provider-config")
@Tags("Provider Config")
@Security("api_key")
export class ProviderConfigController extends Controller {
  @Get("")
  public async getAllProviderConfigurations(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ProviderConfigurationResponse[], string>> {
    const providerConfigManager = new ProviderConfigManager(request.authParams);
    const result = await providerConfigManager.getAllProviderConfigurations();

    if (result.error || !result.data) {
      this.setStatus(500);
      return {
        error: result.error || "Failed to get provider configurations",
        data: null,
      };
    }

    // Transform the response to omit sensitive fields
    const transformedData = result.data.map((config) => ({
      id: config.id,
      provider_name: config.provider_name,
      provider_configuration: config.provider_configuration,
      created_at: config.created_at,
      updated_at: config.updated_at,
      provider_keys: config.provider_keys,
    }));

    return { data: transformedData, error: null };
  }

  @Get("/{providerName}")
  public async getProviderConfiguration(
    @Request() request: JawnAuthenticatedRequest,
    @Path() providerName: string
  ): Promise<Result<ProviderConfigurationResponse, string>> {
    const providerConfigManager = new ProviderConfigManager(request.authParams);
    const result = await providerConfigManager.getProviderConfiguration(
      providerName
    );

    if (result.error || !result.data) {
      this.setStatus(404);
      return {
        error: result.error || "Provider configuration not found",
        data: null,
      };
    }

    // Transform the response to omit sensitive fields
    const transformedData = {
      id: result.data.id,
      provider_name: result.data.provider_name,
      provider_configuration: result.data.provider_configuration,
      created_at: result.data.created_at,
      updated_at: result.data.updated_at,
      provider_keys: result.data.provider_keys,
    };

    return { data: transformedData, error: null };
  }

  @Post("")
  public async upsertProviderConfiguration(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: UpsertProviderConfigRequest
  ): Promise<Result<ProviderConfigurationResponse, string>> {
    const providerConfigManager = new ProviderConfigManager(request.authParams);
    const result = await providerConfigManager.upsertProviderConfiguration(
      body.provider_name,
      body.provider_configuration
    );

    if (result.error || !result.data) {
      this.setStatus(500);
      return {
        error: result.error || "Failed to save provider configuration",
        data: null,
      };
    }

    // Transform the response to omit sensitive fields
    const transformedData = {
      id: result.data.id,
      provider_name: result.data.provider_name,
      provider_configuration: result.data.provider_configuration,
      created_at: result.data.created_at,
      updated_at: result.data.updated_at,
      provider_keys: result.data.provider_keys,
    };

    return { data: transformedData, error: null };
  }

  @Delete("/{providerName}")
  public async deleteProviderConfiguration(
    @Request() request: JawnAuthenticatedRequest,
    @Path() providerName: string
  ): Promise<Result<boolean, string>> {
    const providerConfigManager = new ProviderConfigManager(request.authParams);
    const result = await providerConfigManager.deleteProviderConfiguration(
      providerName
    );

    if (result.error || !result.data) {
      this.setStatus(500);
      return {
        error: result.error || "Failed to delete provider configuration",
        data: null,
      };
    }

    return { data: true, error: null };
  }
}
