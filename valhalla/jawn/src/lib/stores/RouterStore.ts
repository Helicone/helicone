import { supabaseServer } from "../db/supabase";
import { Result, err, ok } from "../shared/result";
import {
  RouterConfig,
  RouterConfiguration,
  RouterProviderMapping,
} from "../../managers/RouterManager";

export class RouterStore {
  private readonly orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  /**
   * Get all router configurations for an organization
   */
  async getRouterConfigurations(): Promise<
    Result<RouterConfiguration[], string>
  > {
    try {
      const { data: routers, error } = await supabaseServer.client
        .from("router_configurations")
        .select("*")
        .eq("org_id", this.orgId)
        .eq("soft_delete", false);

      if (error) {
        return err(error.message);
      }

      // For each router, get its provider mappings
      const routersWithProviders = await Promise.all(
        routers.map(async (router) => {
          const { data: providers, error: providersError } =
            await supabaseServer.client
              .from("router_provider_mappings")
              .select("*")
              .eq("router_id", router.id);

          if (providersError) {
            return { ...router, providers: [] };
          }

          return { ...router, providers };
        })
      );

      return ok(routersWithProviders as RouterConfiguration[]);
    } catch (error) {
      return err(`Failed to get router configurations: ${error}`);
    }
  }

  /**
   * Get a specific router configuration by ID
   */
  async getRouterConfigurationById(
    routerId: string
  ): Promise<Result<RouterConfiguration, string>> {
    try {
      const { data: router, error } = await supabaseServer.client
        .from("router_configurations")
        .select("*")
        .eq("id", routerId)
        .eq("org_id", this.orgId)
        .single();

      if (error) {
        return err(`Router configuration not found: ${error.message}`);
      }

      // Get provider mappings for this router
      const { data: providers, error: providersError } =
        await supabaseServer.client
          .from("router_provider_mappings")
          .select("*")
          .eq("router_id", routerId);

      if (providersError) {
        return err(
          `Failed to get provider mappings: ${providersError.message}`
        );
      }

      return ok({ ...router, providers } as RouterConfiguration);
    } catch (error) {
      return err(`Failed to get router configuration: ${error}`);
    }
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
    try {
      // Create router configuration
      const { data: router, error } = await supabaseServer.client
        .from("router_configurations")
        .insert({
          org_id: this.orgId,
          name: data.name,
          description: data.description || null,
          config: data.config || {},
          is_active: data.is_active !== undefined ? data.is_active : true,
        })
        .select("id")
        .single();

      if (error) {
        return err(`Failed to create router configuration: ${error.message}`);
      }

      return ok({ id: router.id });
    } catch (error) {
      return err(`Failed to create router configuration: ${error}`);
    }
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
    try {
      // Verify ownership of the router
      const { data: existingRouter, error: verifyError } =
        await supabaseServer.client
          .from("router_configurations")
          .select("id")
          .eq("id", routerId)
          .eq("org_id", this.orgId)
          .single();

      if (verifyError || !existingRouter) {
        return err(
          "Router configuration not found or you don't have permission to update it"
        );
      }

      // Update router configuration
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.config !== undefined) updateData.config = data.config;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabaseServer.client
        .from("router_configurations")
        .update(updateData)
        .eq("id", routerId);

      if (updateError) {
        return err(
          `Failed to update router configuration: ${updateError.message}`
        );
      }

      return ok({ id: routerId });
    } catch (error) {
      return err(`Failed to update router configuration: ${error}`);
    }
  }

  /**
   * Delete a router configuration
   */
  async deleteRouterConfiguration(
    routerId: string
  ): Promise<Result<null, string>> {
    try {
      // Verify ownership of the router
      const { data: existingRouter, error: verifyError } =
        await supabaseServer.client
          .from("router_configurations")
          .select("id")
          .eq("id", routerId)
          .eq("org_id", this.orgId)
          .single();

      if (verifyError || !existingRouter) {
        return err(
          "Router configuration not found or you don't have permission to delete it"
        );
      }

      // Soft delete router configuration
      const { error } = await supabaseServer.client
        .from("router_configurations")
        .update({ soft_delete: true })
        .eq("id", routerId);

      if (error) {
        return err(`Failed to delete router configuration: ${error.message}`);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to delete router configuration: ${error}`);
    }
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
    try {
      // Verify ownership of the router
      const { data: existingRouter, error: verifyError } =
        await supabaseServer.client
          .from("router_configurations")
          .select("id")
          .eq("id", data.routerId)
          .eq("org_id", this.orgId)
          .single();

      if (verifyError || !existingRouter) {
        return err(
          "Router configuration not found or you don't have permission to modify it"
        );
      }

      // Check if the provider key belongs to the organization
      const { data: providerKey, error: providerKeyError } =
        await supabaseServer.client
          .from("provider_keys")
          .select("id")
          .eq("id", data.providerKeyId)
          .eq("org_id", this.orgId)
          .single();

      if (providerKeyError || !providerKey) {
        return err(
          "Provider key not found or you don't have permission to use it"
        );
      }

      // Add provider mapping
      const { data: mapping, error } = await supabaseServer.client
        .from("router_provider_mappings")
        .insert({
          router_id: data.routerId,
          provider_key_id: data.providerKeyId,
          role: data.role,
          weight: data.weight || 1.0,
          conditions: data.conditions || null,
        })
        .select("id")
        .single();

      if (error) {
        return err(`Failed to add provider to router: ${error.message}`);
      }

      return ok({ id: mapping.id });
    } catch (error) {
      return err(`Failed to add provider to router: ${error}`);
    }
  }

  /**
   * Remove a provider mapping from a router
   */
  async removeProviderFromRouter(
    mappingId: string
  ): Promise<Result<null, string>> {
    try {
      // Verify ownership of the mapping
      const { data: mapping, error: mappingError } = await supabaseServer.client
        .from("router_provider_mappings")
        .select("router_id")
        .eq("id", mappingId)
        .single();

      if (mappingError || !mapping) {
        return err("Provider mapping not found");
      }

      // Verify ownership of the router
      const { data: router, error: routerError } = await supabaseServer.client
        .from("router_configurations")
        .select("id")
        .eq("id", mapping.router_id)
        .eq("org_id", this.orgId)
        .single();

      if (routerError || !router) {
        return err("You don't have permission to modify this router");
      }

      // Delete provider mapping
      const { error } = await supabaseServer.client
        .from("router_provider_mappings")
        .delete()
        .eq("id", mappingId);

      if (error) {
        return err(`Failed to remove provider from router: ${error.message}`);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to remove provider from router: ${error}`);
    }
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
    try {
      // Verify ownership of the mapping
      const { data: mapping, error: mappingError } = await supabaseServer.client
        .from("router_provider_mappings")
        .select("router_id")
        .eq("id", mappingId)
        .single();

      if (mappingError || !mapping) {
        return err("Provider mapping not found");
      }

      // Verify ownership of the router
      const { data: router, error: routerError } = await supabaseServer.client
        .from("router_configurations")
        .select("id")
        .eq("id", mapping.router_id)
        .eq("org_id", this.orgId)
        .single();

      if (routerError || !router) {
        return err("You don't have permission to modify this router");
      }

      // Update provider mapping
      const updateData: any = {};
      if (data.role !== undefined) updateData.role = data.role;
      if (data.weight !== undefined) updateData.weight = data.weight;
      if (data.conditions !== undefined)
        updateData.conditions = data.conditions;

      const { error } = await supabaseServer.client
        .from("router_provider_mappings")
        .update(updateData)
        .eq("id", mappingId);

      if (error) {
        return err(`Failed to update provider mapping: ${error.message}`);
      }

      return ok({ id: mappingId });
    } catch (error) {
      return err(`Failed to update provider mapping: ${error}`);
    }
  }

  /**
   * Associate a router with a proxy key
   */
  async associateRouterWithProxyKey(
    routerId: string,
    proxyKeyId: string
  ): Promise<Result<null, string>> {
    try {
      // Verify ownership of the router
      const { data: router, error: routerError } = await supabaseServer.client
        .from("router_configurations")
        .select("id")
        .eq("id", routerId)
        .eq("org_id", this.orgId)
        .single();

      if (routerError || !router) {
        return err(
          "Router configuration not found or you don't have permission to modify it"
        );
      }

      // Verify ownership of the proxy key
      const { data: proxyKey, error: proxyKeyError } =
        await supabaseServer.client
          .from("helicone_proxy_keys")
          .select("id")
          .eq("id", proxyKeyId)
          .eq("org_id", this.orgId)
          .single();

      if (proxyKeyError || !proxyKey) {
        return err(
          "Proxy key not found or you don't have permission to modify it"
        );
      }

      // Associate router with proxy key
      const { error } = await supabaseServer.client
        .from("helicone_proxy_keys")
        .update({ router_id: routerId })
        .eq("id", proxyKeyId);

      if (error) {
        return err(
          `Failed to associate router with proxy key: ${error.message}`
        );
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to associate router with proxy key: ${error}`);
    }
  }
}
