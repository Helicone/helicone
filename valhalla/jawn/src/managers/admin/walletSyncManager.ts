import { AuthParams } from "../../packages/common/auth/types";
import { BaseManager } from "../BaseManager";
import Stripe from "stripe";
import { AuthParams } from "../../packages/common/auth/types";
import { BaseManager } from "../BaseManager";
import Stripe from "stripe";
import { ok, err, Result } from "../../packages/common/result";
import { SecretManager } from "@helicone-package/secrets/SecretManager";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { ok, err, Result } from "../../packages/common/result";
import { SecretManager } from "@helicone-package/secrets/SecretManager";
import { dbExecute } from "../../lib/shared/db/dbExecute";

export class AdminManager extends BaseManager {
  private stripe: Stripe;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.stripe = new Stripe(
      SecretManager.getSecret("STRIPE_SECRET_KEY") || "",
      {
        apiVersion: "2025-02-24.acacia",
      }
    );
  }

  async publicCheckOrganizationWallet(organizationId: string): Promise<Result<any, string>> {
    const query = `
      SELECT * FROM organization_wallet WHERE organization_id = $1
    `;
    const result = await dbExecute<{
      id: string;
      organization_id: string;
    }>(query, [organizationId]);
    
    if (result.error) {
      return err(result.error);
    }
    
    return ok(result.data);
  }
}
