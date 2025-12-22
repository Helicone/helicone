import { Controller, Get, Route, Tags } from "tsoa";
import { Result, err, ok } from "../../packages/common/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";

/**
 * Public SSO endpoints that don't require authentication.
 * Used by the sign-in flow to check if a domain has SSO configured.
 */
@Route("/v1/public/sso")
@Tags("SSO")
export class SSOPublicController extends Controller {
  /**
   * Check if a domain has SSO configured (public endpoint for sign-in flow)
   * No authentication required.
   */
  @Get("/check/{domain}")
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
}
