import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Route,
  Security,
  Tags,
  Request,
} from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { Result } from "../../lib/shared/result";
import {
  RouterManager,
  RouterConfig,
  RouterConfiguration,
  RouterProviderMapping,
} from "../../managers/RouterManager";

/**
 * Represent request to create a new router configuration
 */
export interface CreateRouterConfigurationRequest {
  /** Name of the router configuration */
  name: string;
  /** Optional description */
  description?: string;
  /** Router configuration parameters */
  config: RouterConfig;
  /** Whether the router is active (default: true) */
  is_active?: boolean;
}

/**
 * Represent request to update an existing router configuration
 */
export interface UpdateRouterConfigurationRequest {
  /** Name of the router configuration */
  name?: string;
  /** Optional description */
  description?: string;
  /** Router configuration parameters */
  config?: RouterConfig;
  /** Whether the router is active */
  is_active?: boolean;
}

/**
 * Represent request to add a provider to a router
 */
export interface AddProviderToRouterRequest {
  /** ID of the provider key to add */
  providerKeyId: string;
  /** Provider's role in the router */
  role: "primary" | "fallback" | "conditional";
  /** Weight for weighted routing (default: 1.0) */
  weight?: number;
  /** Conditions for when to use this provider */
  conditions?: Record<string, any>;
}

/**
 * Represent request to update a provider mapping
 */
export interface UpdateProviderMappingRequest {
  /** Provider's role in the router */
  role?: "primary" | "fallback" | "conditional";
  /** Weight for weighted routing */
  weight?: number;
  /** Conditions for when to use this provider */
  conditions?: Record<string, any>;
}

/**
 * Represent request to associate a router with a proxy key
 */
export interface AssociateRouterWithProxyKeyRequest {
  /** ID of the proxy key to associate with the router */
  proxyKeyId: string;
}

@Route("v1/router")
@Tags("Router")
@Security("bearerAuth")
export class RouterController extends Controller {
  /**
   * Get all router configurations for the authenticated organization
   */
  @Get("/")
  public async getRouterConfigurations(
    @Request() req: JawnAuthenticatedRequest
  ): Promise<Result<RouterConfiguration[], string>> {
    const routerManager = new RouterManager(req.authParams);
    return await routerManager.getRouterConfigurations();
  }

  /**
   * Get a specific router configuration by ID
   */
  @Get("/{routerId}")
  public async getRouterConfigurationById(
    @Path() routerId: string,
    @Request() req: JawnAuthenticatedRequest
  ): Promise<Result<RouterConfiguration, string>> {
    const routerManager = new RouterManager(req.authParams);
    return await routerManager.getRouterConfigurationById(routerId);
  }

  /**
   * Create a new router configuration
   */
  @Post("/")
  public async createRouterConfiguration(
    @Body() requestBody: CreateRouterConfigurationRequest,
    @Request() req: JawnAuthenticatedRequest
  ): Promise<Result<{ id: string }, string>> {
    const routerManager = new RouterManager(req.authParams);
    return await routerManager.createRouterConfiguration(requestBody);
  }

  /**
   * Update an existing router configuration
   */
  @Put("/{routerId}")
  public async updateRouterConfiguration(
    @Path() routerId: string,
    @Body() requestBody: UpdateRouterConfigurationRequest,
    @Request() req: JawnAuthenticatedRequest
  ): Promise<Result<{ id: string }, string>> {
    const routerManager = new RouterManager(req.authParams);
    return await routerManager.updateRouterConfiguration(routerId, requestBody);
  }

  /**
   * Delete a router configuration
   */
  @Delete("/{routerId}")
  public async deleteRouterConfiguration(
    @Path() routerId: string,
    @Request() req: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const routerManager = new RouterManager(req.authParams);
    return await routerManager.deleteRouterConfiguration(routerId);
  }

  /**
   * Add a provider to a router
   */
  @Post("/{routerId}/providers")
  public async addProviderToRouter(
    @Path() routerId: string,
    @Body() requestBody: AddProviderToRouterRequest,
    @Request() req: JawnAuthenticatedRequest
  ): Promise<Result<{ id: string }, string>> {
    const routerManager = new RouterManager(req.authParams);
    return await routerManager.addProviderToRouter({
      routerId,
      providerKeyId: requestBody.providerKeyId,
      role: requestBody.role,
      weight: requestBody.weight,
      conditions: requestBody.conditions,
    });
  }

  /**
   * Remove a provider from a router
   */
  @Delete("/{routerId}/providers/{mappingId}")
  public async removeProviderFromRouter(
    @Path() routerId: string,
    @Path() mappingId: string,
    @Request() req: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const routerManager = new RouterManager(req.authParams);
    return await routerManager.removeProviderFromRouter(mappingId);
  }

  /**
   * Update a provider mapping
   */
  @Put("/{routerId}/providers/{mappingId}")
  public async updateProviderMapping(
    @Path() routerId: string,
    @Path() mappingId: string,
    @Body() requestBody: UpdateProviderMappingRequest,
    @Request() req: JawnAuthenticatedRequest
  ): Promise<Result<{ id: string }, string>> {
    const routerManager = new RouterManager(req.authParams);
    return await routerManager.updateProviderMapping(mappingId, requestBody);
  }

  /**
   * Associate a router with a proxy key
   */
  @Post("/{routerId}/proxy-key")
  public async associateRouterWithProxyKey(
    @Path() routerId: string,
    @Body() requestBody: AssociateRouterWithProxyKeyRequest,
    @Request() req: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const routerManager = new RouterManager(req.authParams);
    return await routerManager.associateRouterWithProxyKey(
      routerId,
      requestBody.proxyKeyId
    );
  }
}
