import { SupabaseConnector } from "../../packages/common/toImplement/server/SupabaseAuthWrapper";
import { err, ok, Result } from "../../packages/common/result";

export class SSOManager {
  private supabase: SupabaseConnector;

  constructor() {
    this.supabase = new SupabaseConnector();
  }

  async createSSOProvider(
    domain: string,
    metadataUrl: string
  ): Promise<Result<{ providerId: string }, string>> {
    try {
      // Use the Supabase Admin API to create an SSO provider
      // Note: This requires the service role key
      const response = await fetch(
        `${process.env.SUPABASE_URL}/auth/v1/admin/sso/providers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          },
          body: JSON.stringify({
            type: "saml",
            metadata_url: metadataUrl,
            domains: [domain],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return err(
          errorData.message ||
            errorData.error ||
            `Failed to create SSO provider: ${response.status}`
        );
      }

      const data = await response.json();
      return ok({ providerId: data.id });
    } catch (error) {
      return err(
        error instanceof Error ? error.message : "Failed to create SSO provider"
      );
    }
  }

  async getSSOProvider(
    domain: string
  ): Promise<Result<{ providerId: string; domain: string } | null, string>> {
    try {
      const response = await fetch(
        `${process.env.SUPABASE_URL}/auth/v1/admin/sso/providers`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          },
        }
      );

      if (!response.ok) {
        return err(`Failed to get SSO providers: ${response.status}`);
      }

      const data = await response.json();
      const provider = data.items?.find((p: any) =>
        p.domains?.some((d: any) => d.domain === domain)
      );

      if (!provider) {
        return ok(null);
      }

      return ok({
        providerId: provider.id,
        domain: domain,
      });
    } catch (error) {
      return err(
        error instanceof Error ? error.message : "Failed to get SSO provider"
      );
    }
  }

  async deleteSSOProvider(providerId: string): Promise<Result<null, string>> {
    try {
      const response = await fetch(
        `${process.env.SUPABASE_URL}/auth/v1/admin/sso/providers/${providerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          },
        }
      );

      if (!response.ok) {
        return err(`Failed to delete SSO provider: ${response.status}`);
      }

      return ok(null);
    } catch (error) {
      return err(
        error instanceof Error ? error.message : "Failed to delete SSO provider"
      );
    }
  }
}
