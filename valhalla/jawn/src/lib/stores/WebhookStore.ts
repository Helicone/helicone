import { Database } from "../db/database.types";
import { dbExecute } from "../shared/db/dbExecute";
import { PromiseGenericResult, err, ok } from "../../packages/common/result";

export class WebhookStore {
  constructor() {}

  async getWebhooksByOrgId(
    orgId: string,
  ): PromiseGenericResult<Database["public"]["Tables"]["webhooks"]["Row"][]> {
    try {
      const result = await dbExecute<
        Database["public"]["Tables"]["webhooks"]["Row"]
      >(
        `SELECT *
         FROM webhooks
         WHERE org_id = $1`,
        [orgId],
      );

      if (result.error) {
        return err(`Failed to get webhooks for org ${orgId}: ${result.error}`);
      }

      return ok(result.data || []);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      return err(`Failed to get webhooks for org ${orgId}: ${String(error)}`);
    }
  }

  async getWebhookSubscriptionByWebhookId(
    webhookId: number,
  ): PromiseGenericResult<
    Database["public"]["Tables"]["webhook_subscriptions"]["Row"][]
  > {
    try {
      const result = await dbExecute<
        Database["public"]["Tables"]["webhook_subscriptions"]["Row"]
      >(
        `SELECT *
         FROM webhook_subscriptions
         WHERE webhook_id = $1`,
        [webhookId],
      );

      if (result.error) {
        return err(
          `Failed to get webhook subscriptions for webhook ${webhookId}: ${result.error}`,
        );
      }

      return ok(result.data || []);
    } catch (error) {
      console.error("Error fetching webhook subscriptions:", error);
      return err(
        `Failed to get webhook subscriptions for webhook ${webhookId}: ${String(
          error,
        )}`,
      );
    }
  }
}
