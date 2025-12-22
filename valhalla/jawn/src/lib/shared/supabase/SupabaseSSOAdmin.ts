import { SecretManager } from "@helicone-package/secrets/SecretManager";
import { Result, err, ok } from "../../../packages/common/result";

interface SupabaseSSOProvider {
  id: string;
  saml?: {
    entity_id: string;
    metadata_url?: string;
    metadata_xml?: string;
    attribute_mapping?: {
      keys?: {
        [key: string]: { name: string };
      };
    };
  };
  domains?: { domain: string }[];
  created_at: string;
  updated_at: string;
}

interface CreateSSOProviderRequest {
  type: "saml";
  metadata_url?: string;
  metadata_xml?: string;
  domains: string[];
  attribute_mapping?: {
    keys?: {
      [key: string]: { name: string };
    };
  };
}

/**
 * Utility class for managing SSO providers in Supabase GoTrue via admin API.
 * This is required for SAML SSO to work - both Helicone DB and Supabase GoTrue
 * need to have the IdP registered.
 */
export class SupabaseSSOAdmin {
  private supabaseUrl: string;
  private serviceRoleKey: string;

  constructor() {
    const SUPABASE_CREDS = JSON.parse(
      SecretManager.getSecret("SUPABASE_CREDS") ?? "{}"
    );

    this.supabaseUrl =
      SUPABASE_CREDS?.url ??
      process.env.SUPABASE_URL ??
      SecretManager.getSecret("SUPABASE_URL") ??
      "";

    this.serviceRoleKey =
      SUPABASE_CREDS?.service_role_key ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      SecretManager.getSecret(
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_SERVICE_KEY"
      ) ??
      "";

    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new Error("Supabase credentials not configured");
    }
  }

  /**
   * Fetches the IdP metadata XML from a URL.
   * Used when registering providers since Supabase requires HTTPS for metadata_url
   * but we may have HTTP URLs for local testing.
   */
  private async fetchMetadataXml(metadataUrl: string): Promise<Result<string, string>> {
    try {
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        return err(`Failed to fetch metadata: ${response.statusText}`);
      }
      const xml = await response.text();
      return ok(xml);
    } catch (error) {
      return err(`Failed to fetch metadata: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Creates an SSO provider in Supabase GoTrue.
   * Returns the provider ID which should be stored in our database.
   */
  async createProvider(
    metadataUrl: string,
    domain: string
  ): Promise<Result<string, string>> {
    try {
      // Check if metadata URL is HTTPS - Supabase requires HTTPS for metadata_url
      const isHttps = metadataUrl.startsWith("https://");

      let requestBody: CreateSSOProviderRequest;

      if (isHttps) {
        // Use metadata_url directly for HTTPS
        requestBody = {
          type: "saml",
          metadata_url: metadataUrl,
          domains: [domain],
          attribute_mapping: {
            keys: {
              email: { name: "email" },
            },
          },
        };
      } else {
        // Fetch metadata XML for HTTP URLs
        const xmlResult = await this.fetchMetadataXml(metadataUrl);
        if (xmlResult.error || !xmlResult.data) {
          return err(xmlResult.error || "Failed to fetch metadata XML");
        }
        requestBody = {
          type: "saml",
          metadata_xml: xmlResult.data,
          domains: [domain],
          attribute_mapping: {
            keys: {
              email: { name: "email" },
            },
          },
        };
      }

      const response = await fetch(
        `${this.supabaseUrl}/auth/v1/admin/sso/providers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.serviceRoleKey}`,
            apikey: this.serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {
          errorMessage = errorText;
        }
        return err(`Failed to register SSO provider with Supabase: ${errorMessage}`);
      }

      const data: SupabaseSSOProvider = await response.json();
      return ok(data.id);
    } catch (error) {
      return err(
        `Failed to create SSO provider: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Deletes an SSO provider from Supabase GoTrue.
   */
  async deleteProvider(providerId: string): Promise<Result<null, string>> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/auth/v1/admin/sso/providers/${providerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.serviceRoleKey}`,
            apikey: this.serviceRoleKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        // If provider not found, treat as success (already deleted)
        if (response.status === 404) {
          return ok(null);
        }
        return err(`Failed to delete SSO provider from Supabase: ${errorText}`);
      }

      return ok(null);
    } catch (error) {
      return err(
        `Failed to delete SSO provider: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Updates an SSO provider in Supabase GoTrue.
   * Used when domain or metadata changes.
   */
  async updateProvider(
    providerId: string,
    metadataUrl?: string,
    domain?: string
  ): Promise<Result<null, string>> {
    try {
      console.log(`[SupabaseSSOAdmin] Updating provider:`, {
        providerId,
        metadataUrl,
        domain,
        supabaseUrl: this.supabaseUrl,
      });
      const updateBody: Partial<CreateSSOProviderRequest> = {};

      if (metadataUrl) {
        const isHttps = metadataUrl.startsWith("https://");
        if (isHttps) {
          updateBody.metadata_url = metadataUrl;
        } else {
          const xmlResult = await this.fetchMetadataXml(metadataUrl);
          if (xmlResult.error || !xmlResult.data) {
            return err(xmlResult.error || "Failed to fetch metadata XML");
          }
          updateBody.metadata_xml = xmlResult.data;
        }
      }

      if (domain) {
        updateBody.domains = [domain];
      }

      const response = await fetch(
        `${this.supabaseUrl}/auth/v1/admin/sso/providers/${providerId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${this.serviceRoleKey}`,
            apikey: this.serviceRoleKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SupabaseSSOAdmin] Update failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          providerId,
          updateBody,
        });
        return err(`Failed to update SSO provider in Supabase: ${errorText}`);
      }

      return ok(null);
    } catch (error) {
      console.error(`[SupabaseSSOAdmin] Update exception:`, error);
      return err(
        `Failed to update SSO provider: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Gets an SSO provider from Supabase GoTrue by ID.
   */
  async getProvider(
    providerId: string
  ): Promise<Result<SupabaseSSOProvider | null, string>> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/auth/v1/admin/sso/providers/${providerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.serviceRoleKey}`,
            apikey: this.serviceRoleKey,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return ok(null);
        }
        const errorText = await response.text();
        return err(`Failed to get SSO provider from Supabase: ${errorText}`);
      }

      const data: SupabaseSSOProvider = await response.json();
      return ok(data);
    } catch (error) {
      return err(
        `Failed to get SSO provider: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
