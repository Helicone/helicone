import { AuthParams, OrgParams, supabaseServer } from "../db/supabase";
import { PromiseGenericResult, err, ok } from "../modules/result";
import { BearerAuth } from "../requestWrapper";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class AuthenticationHandler extends AbstractLogHandler {
  async handle(context: HandlerContext): Promise<void> {
    const authResult = await this.authenticateEntry(context);
    if (authResult.error || !authResult.data) {
      console.log(`Authenticated Failed: ${authResult.error}`);
      return;
    }

    const orgResult = await this.getOrganization(authResult.data);
    if (orgResult.error || !orgResult.data) {
      console.log(`Organization not found: ${orgResult.error}`);
      return;
    }

    context.addAuthParams(authResult.data);
    context.addOrgParams(orgResult.data);

    await super.handle(context);
  }

  private async authenticateEntry(
    context: HandlerContext
  ): PromiseGenericResult<AuthParams> {
    const bearerToken: BearerAuth = {
      _type: "bearer",
      token: context.message.authorization,
    };

    const authResult = await supabaseServer.authenticate(bearerToken);
    if (authResult.error || !authResult.data?.organizationId) {
      return err(
        `Authentication failed: ${
          authResult.error || "Missing organization ID"
        }`
      );
    }

    return ok(authResult.data);
  }

  private async getOrganization(
    authParams: AuthParams
  ): PromiseGenericResult<OrgParams> {
    const orgResult = await supabaseServer.getOrganization(authParams);
    if (orgResult.error || !orgResult.data) {
      return err(`Organization not found: ${orgResult.error}`);
    }

    return ok(orgResult.data);
  }
}
