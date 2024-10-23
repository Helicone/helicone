import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../db/database.types";
import { PromiseGenericResult, err, ok } from "../shared/result";

export class WebhookStore {
  private supabaseClient: SupabaseClient<Database>;
  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabaseClient = supabaseClient;
  }

  async getWebhooksByOrgId(
    orgId: string
  ): PromiseGenericResult<Database["public"]["Tables"]["webhooks"]["Row"][]> {
    const webhooks = await this.supabaseClient
      .from("webhooks")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_verified", true);

    if (webhooks.error) {
      err(`Failed to get webhooks for org ${orgId}: ${webhooks.error.message}`);
    }

    return ok(webhooks.data ?? []);
  }

  async getWebhookSubscriptionByWebhookId(
    webhookId: number
  ): PromiseGenericResult<
    Database["public"]["Tables"]["webhook_subscriptions"]["Row"][]
  > {
    const subscriptions = await this.supabaseClient
      .from("webhook_subscriptions")
      .select("*")
      .eq("webhook_id", webhookId);

    if (subscriptions.error) {
      err(
        `Failed to get webhook subscriptions for webhook ${webhookId}: ${subscriptions.error.message}`
      );
    }

    return ok(subscriptions.data ?? []);
  }
}
