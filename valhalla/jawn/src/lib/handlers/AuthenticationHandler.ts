import { KafkaProducer } from "../clients/KafkaProducer";
import { AuthParams, OrgParams, supabaseServer } from "../db/supabase";
import { HeliconeAuth } from "../requestWrapper";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class AuthenticationHandler extends AbstractLogHandler {
  async handle(context: HandlerContext): PromiseGenericResult<string> {
    try {
      const authResult = await this.authenticateEntry(context);
      if (authResult.error || !authResult.data) {
        return err(`Authentication failed: ${authResult.error}`);
      }

      const orgResult = await this.getOrganization(authResult.data);
      if (orgResult.error || !orgResult.data) {
        return err(`Organization not found: ${orgResult.error}`);
      }

      context.authParams = authResult.data;
      context.orgParams = orgResult.data;

      return await super.handle(context);
    } catch (error) {
      return err(
        `Error processing authentication: ${error}, Context: ${this.constructor.name}`
      );
    }
  }

  private async authenticateEntry(
    context: HandlerContext
  ): PromiseGenericResult<AuthParams> {
    let heliconeAuth: HeliconeAuth;
    if (
      context.message.authorization.startsWith("Bearer sk-helicone-proxy") ||
      context.message.authorization.startsWith("Bearer pk-helicone-proxy")
    ) {
      heliconeAuth = {
        _type: "bearerProxy",
        token: context.message.authorization,
      };
    } else {
      heliconeAuth = {
        _type: "bearer",
        token: context.message.authorization,
      };
    }

    const authResult = await supabaseServer.authenticate(heliconeAuth);
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
