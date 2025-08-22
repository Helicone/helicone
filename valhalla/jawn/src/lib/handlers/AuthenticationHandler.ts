import { HeliconeAuth } from "../../packages/common/auth/types";
import { getHeliconeAuthClient } from "../../packages/common/auth/server/AuthClientFactory";
import { AuthParams } from "../../packages/common/auth/types";
import { OrgParams } from "../../packages/common/auth/types";
import { PromiseGenericResult, err, ok } from "../../packages/common/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { getAndStoreInCache } from "../cache/staticMemCache";

export class AuthenticationHandler extends AbstractLogHandler {
  async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });

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

    const authClient = getHeliconeAuthClient();

    const authResult = await getAndStoreInCache(
      `auth-${JSON.stringify(heliconeAuth)}`,
      async () => authClient.authenticate(heliconeAuth),
      60 // 1 minute
    );

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
    const authClient = getHeliconeAuthClient();
    const orgResult = await authClient.getOrganization(authParams);
    if (orgResult.error || !orgResult.data) {
      return err(`Organization not found: ${orgResult.error}`);
    }

    return ok(orgResult.data);
  }
}
