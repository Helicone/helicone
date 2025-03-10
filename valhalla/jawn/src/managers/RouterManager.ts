import { BaseManager } from "./BaseManager";
import { Result } from "../lib/shared/result";
import { AuthParams } from "../lib/db/supabase";
import { Database } from "../lib/db/database.types";
import { RouterStore } from "../lib/stores/RouterStore";

// Type definitions for router configurations
export type RouterConfig = {
  limits?: {
    rate?: {
      requests_per_minute?: number;
      tokens_per_day?: number;
    };
    cost?: {
      max_cost_per_request?: number;
      max_cost_per_day?: number;
      currency?: string;
    };
  };
  routing_strategy?:
    | "weighted-random"
    | "round-robin"
    | "fallback-only"
    | "cost-optimized";
};

export type RouterProviderMapping = {
  id: string;
  router_id: string;
  provider_key_id: string;
  role: "primary" | "fallback" | "conditional";
  weight: number;
  conditions?: Record<string, any>;
};

export type RouterConfiguration =
  Database["public"]["Tables"]["router_configurations"]["Row"] & {
    providers?: RouterProviderMapping[];
  };

export class RouterManager extends BaseManager {
  private readonly routerStore: RouterStore;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.routerStore = new RouterStore(authParams.organizationId);
  }

  /**
   * Get all router configurations for an organization
   */
  async getRouterConfigurations(): Promise<
    Result<RouterConfiguration[], string>
  > {
    return this.routerStore.getRouterConfigurations();
  }

  /**
   * Get a specific router configuration by ID
   */
  async getRouterConfigurationById(
    routerId: string
  ): Promise<Result<RouterConfiguration, string>> {
    return this.routerStore.getRouterConfigurationById(routerId);
  }

  /**
   * Create a new router configuration
   */
  async createRouterConfiguration(data: {
    name: string;
    description?: string;
    config: RouterConfig;
    is_active?: boolean;
  }): Promise<Result<{ id: string }, string>> {
    return this.routerStore.createRouterConfiguration(data);
  }

  /**
   * Update an existing router configuration
   */
  async updateRouterConfiguration(
    routerId: string,
    data: {
      name?: string;
      description?: string;
      config?: RouterConfig;
      is_active?: boolean;
    }
  ): Promise<Result<{ id: string }, string>> {
    return this.routerStore.updateRouterConfiguration(routerId, data);
  }

  /**
   * Delete a router configuration
   */
  async deleteRouterConfiguration(
    routerId: string
  ): Promise<Result<null, string>> {
    return this.routerStore.deleteRouterConfiguration(routerId);
  }

  /**
   * Add a provider mapping to a router
   */
  async addProviderToRouter(data: {
    routerId: string;
    providerKeyId: string;
    role: "primary" | "fallback" | "conditional";
    weight?: number;
    conditions?: Record<string, any>;
  }): Promise<Result<{ id: string }, string>> {
    return this.routerStore.addProviderToRouter(data);
  }

  /**
   * Remove a provider mapping from a router
   */
  async removeProviderFromRouter(
    mappingId: string
  ): Promise<Result<null, string>> {
    return this.routerStore.removeProviderFromRouter(mappingId);
  }

  /**
   * Update a provider mapping in a router
   */
  async updateProviderMapping(
    mappingId: string,
    data: {
      role?: "primary" | "fallback" | "conditional";
      weight?: number;
      conditions?: Record<string, any>;
    }
  ): Promise<Result<{ id: string }, string>> {
    return this.routerStore.updateProviderMapping(mappingId, data);
  }

  /**
   * Associate a router with a proxy key
   */
  async associateRouterWithProxyKey(
    routerId: string,
    proxyKeyId: string
  ): Promise<Result<null, string>> {
    return this.routerStore.associateRouterWithProxyKey(routerId, proxyKeyId);
  }
}
