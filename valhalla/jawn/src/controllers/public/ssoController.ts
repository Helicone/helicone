import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result, err, ok } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { SupabaseSSOAdmin } from "../../lib/shared/supabase/SupabaseSSOAdmin";

export interface SSOConfig {
  id: string;
  organizationId: string;
  domain: string;
  providerId: string | null;
  metadataUrl: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSSOConfigRequest {
  domain: string;
  metadataUrl: string;
}

export interface UpdateSSOConfigRequest {
  domain?: string;
  metadataUrl?: string;
  enabled?: boolean;
}

// Allowed tiers for SSO feature
const SSO_ALLOWED_TIERS = [
  "team-20250130",
  "growth",
  "enterprise",
];

@Route("/v1/organization/sso")
@Tags("SSO")
@Security("api_key")
export class SSOController extends Controller {
  /**
   * Get SSO configuration for the current organization
   */
  @Get("/")
  public async getSSOConfig(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<SSOConfig | null, string>> {
    const result = await dbExecute<{
      id: string;
      organization_id: string;
      domain: string;
      provider_id: string | null;
      metadata_url: string | null;
      enabled: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, organization_id, domain, provider_id, metadata_url, enabled, created_at, updated_at
       FROM organization_sso_config
       WHERE organization_id = $1`,
      [request.authParams.organizationId]
    );

    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    }

    if (!result.data || result.data.length === 0) {
      this.setStatus(200);
      return ok(null);
    }

    const config = result.data[0];
    this.setStatus(200);
    return ok({
      id: config.id,
      organizationId: config.organization_id,
      domain: config.domain,
      providerId: config.provider_id,
      metadataUrl: config.metadata_url,
      enabled: config.enabled,
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    });
  }

  /**
   * Create SSO configuration for the current organization
   */
  @Post("/")
  public async createSSOConfig(
    @Body() body: CreateSSOConfigRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<SSOConfig, string>> {
    // Validate tier access
    const tierCheck = await this.checkTierAccess(
      request.authParams.organizationId
    );
    if (tierCheck.error) {
      this.setStatus(403);
      return err(tierCheck.error);
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(body.domain)) {
      this.setStatus(400);
      return err("Invalid domain format");
    }

    // Block common public domains
    const publicDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "aol.com",
      "protonmail.com",
    ];
    if (publicDomains.includes(body.domain.toLowerCase())) {
      this.setStatus(400);
      return err("Public email domains are not allowed for SSO");
    }

    // Validate metadata URL format
    try {
      new URL(body.metadataUrl);
    } catch {
      this.setStatus(400);
      return err("Invalid metadata URL format");
    }

    // Check if domain is already taken
    const existingDomain = await dbExecute(
      `SELECT id FROM organization_sso_config WHERE domain = $1`,
      [body.domain.toLowerCase()]
    );
    if (existingDomain.data && existingDomain.data.length > 0) {
      this.setStatus(400);
      return err("This domain is already configured for another organization");
    }

    // Check if org already has SSO config
    const existingConfig = await dbExecute(
      `SELECT id FROM organization_sso_config WHERE organization_id = $1`,
      [request.authParams.organizationId]
    );
    if (existingConfig.data && existingConfig.data.length > 0) {
      this.setStatus(400);
      return err(
        "SSO configuration already exists. Use PUT to update or DELETE to remove."
      );
    }

    // Register SSO provider with Supabase GoTrue
    const ssoAdmin = new SupabaseSSOAdmin();
    const supabaseResult = await ssoAdmin.createProvider(
      body.metadataUrl,
      body.domain.toLowerCase()
    );

    if (supabaseResult.error || !supabaseResult.data) {
      this.setStatus(500);
      return err(supabaseResult.error || "Failed to create SSO provider");
    }

    const providerId = supabaseResult.data;

    // Create the SSO config with provider_id from Supabase and enabled=true
    const result = await dbExecute<{
      id: string;
      organization_id: string;
      domain: string;
      provider_id: string | null;
      metadata_url: string | null;
      enabled: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO organization_sso_config (organization_id, domain, metadata_url, provider_id, enabled)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, organization_id, domain, provider_id, metadata_url, enabled, created_at, updated_at`,
      [
        request.authParams.organizationId,
        body.domain.toLowerCase(),
        body.metadataUrl,
        providerId,
      ]
    );

    if (result.error || !result.data || result.data.length === 0) {
      // If DB insert fails, try to clean up the Supabase provider
      await ssoAdmin.deleteProvider(providerId);
      this.setStatus(500);
      return err(result.error || "Failed to create SSO configuration");
    }

    const config = result.data[0];
    this.setStatus(201);
    return ok({
      id: config.id,
      organizationId: config.organization_id,
      domain: config.domain,
      providerId: config.provider_id,
      metadataUrl: config.metadata_url,
      enabled: config.enabled,
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    });
  }

  /**
   * Update SSO configuration for the current organization
   */
  @Put("/")
  public async updateSSOConfig(
    @Body() body: UpdateSSOConfigRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<SSOConfig, string>> {
    // Validate tier access
    const tierCheck = await this.checkTierAccess(
      request.authParams.organizationId
    );
    if (tierCheck.error) {
      this.setStatus(403);
      return err(tierCheck.error);
    }

    // Validate domain if provided
    if (body.domain) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(body.domain)) {
        this.setStatus(400);
        return err("Invalid domain format");
      }

      const publicDomains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "icloud.com",
        "aol.com",
        "protonmail.com",
      ];
      if (publicDomains.includes(body.domain.toLowerCase())) {
        this.setStatus(400);
        return err("Public email domains are not allowed for SSO");
      }

      // Check if domain is taken by another org
      const existingDomain = await dbExecute<{ organization_id: string }>(
        `SELECT organization_id FROM organization_sso_config WHERE domain = $1`,
        [body.domain.toLowerCase()]
      );
      if (
        existingDomain.data &&
        existingDomain.data.length > 0 &&
        existingDomain.data[0].organization_id !==
          request.authParams.organizationId
      ) {
        this.setStatus(400);
        return err(
          "This domain is already configured for another organization"
        );
      }
    }

    // Validate metadata URL if provided
    if (body.metadataUrl) {
      try {
        new URL(body.metadataUrl);
      } catch {
        this.setStatus(400);
        return err("Invalid metadata URL format");
      }
    }

    // Get current config to check provider_id
    const currentConfig = await dbExecute<{
      provider_id: string | null;
      domain: string;
      metadata_url: string | null;
    }>(
      `SELECT provider_id, domain, metadata_url FROM organization_sso_config WHERE organization_id = $1`,
      [request.authParams.organizationId]
    );

    if (!currentConfig.data || currentConfig.data.length === 0) {
      this.setStatus(404);
      return err("SSO configuration not found");
    }

    const { provider_id: providerId } = currentConfig.data[0];

    // If domain or metadataUrl changed and we have a provider_id, update in Supabase
    if (providerId && (body.domain !== undefined || body.metadataUrl !== undefined)) {
      const ssoAdmin = new SupabaseSSOAdmin();
      const updateResult = await ssoAdmin.updateProvider(
        providerId,
        body.metadataUrl,
        body.domain?.toLowerCase()
      );
      if (updateResult.error) {
        this.setStatus(500);
        return err(updateResult.error);
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | boolean)[] = [];
    let paramIndex = 1;

    if (body.domain !== undefined) {
      updates.push(`domain = $${paramIndex++}`);
      values.push(body.domain.toLowerCase());
    }
    if (body.metadataUrl !== undefined) {
      updates.push(`metadata_url = $${paramIndex++}`);
      values.push(body.metadataUrl);
    }
    if (body.enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(body.enabled);
    }

    if (updates.length === 0) {
      this.setStatus(400);
      return err("No fields to update");
    }

    values.push(request.authParams.organizationId);

    const result = await dbExecute<{
      id: string;
      organization_id: string;
      domain: string;
      provider_id: string | null;
      metadata_url: string | null;
      enabled: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `UPDATE organization_sso_config
       SET ${updates.join(", ")}
       WHERE organization_id = $${paramIndex}
       RETURNING id, organization_id, domain, provider_id, metadata_url, enabled, created_at, updated_at`,
      values
    );

    if (result.error || !result.data || result.data.length === 0) {
      this.setStatus(500);
      return err(result.error || "Failed to update SSO configuration");
    }

    const config = result.data[0];
    this.setStatus(200);
    return ok({
      id: config.id,
      organizationId: config.organization_id,
      domain: config.domain,
      providerId: config.provider_id,
      metadataUrl: config.metadata_url,
      enabled: config.enabled,
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    });
  }

  /**
   * Delete SSO configuration for the current organization
   */
  @Delete("/")
  public async deleteSSOConfig(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    // First get the provider_id so we can delete from Supabase
    const existingConfig = await dbExecute<{ provider_id: string | null }>(
      `SELECT provider_id FROM organization_sso_config WHERE organization_id = $1`,
      [request.authParams.organizationId]
    );

    // Delete from Supabase if provider_id exists
    if (
      existingConfig.data &&
      existingConfig.data.length > 0 &&
      existingConfig.data[0].provider_id
    ) {
      const ssoAdmin = new SupabaseSSOAdmin();
      const supabaseResult = await ssoAdmin.deleteProvider(
        existingConfig.data[0].provider_id
      );
      if (supabaseResult.error) {
        // Log but don't fail - the provider may have been manually deleted
        console.warn(
          `Failed to delete SSO provider from Supabase: ${supabaseResult.error}`
        );
      }
    }

    // Delete from our database
    const result = await dbExecute(
      `DELETE FROM organization_sso_config WHERE organization_id = $1`,
      [request.authParams.organizationId]
    );

    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    }

    this.setStatus(200);
    return ok(null);
  }

  /**
   * Check if a domain has SSO configured (public endpoint for sign-in flow)
   */
  @Get("/check/{domain}")
  @Security("api_key", [])
  public async checkDomainSSO(
    domain: string
  ): Promise<Result<{ hasSSO: boolean; organizationId?: string }, string>> {
    const result = await dbExecute<{
      organization_id: string;
      enabled: boolean;
    }>(
      `SELECT organization_id, enabled
       FROM organization_sso_config
       WHERE domain = $1 AND enabled = true`,
      [domain.toLowerCase()]
    );

    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    }

    if (!result.data || result.data.length === 0) {
      this.setStatus(200);
      return ok({ hasSSO: false });
    }

    this.setStatus(200);
    return ok({
      hasSSO: true,
      organizationId: result.data[0].organization_id,
    });
  }

  private async checkTierAccess(
    organizationId: string
  ): Promise<Result<boolean, string>> {
    const result = await dbExecute<{ tier: string | null }>(
      `SELECT tier FROM organization WHERE id = $1`,
      [organizationId]
    );

    if (result.error || !result.data || result.data.length === 0) {
      return err("Failed to verify organization tier");
    }

    const tier = result.data[0].tier;
    if (!tier || !SSO_ALLOWED_TIERS.includes(tier)) {
      return err(
        "SSO is only available on Team, Growth, and Enterprise plans"
      );
    }

    return ok(true);
  }
}
