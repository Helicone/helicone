import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../db/database.types";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { cacheResultCustom } from "../../utils/cacheResult";
import { KVCache } from "../cache/kvCache";
const kvCache = new KVCache(5 * 60 * 1000); // 5 minutes

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
      .eq("org_id", orgId);

    if (webhooks.data) {
      return ok(webhooks.data);
    }

    return err(`Failed to get webhooks for org ${orgId}: ${webhooks.error}`);
    // return await cacheResultCustom(
    //   "getWebhooksByOrgId-" + orgId,
    //   async () => {
    //   },
    //   kvCache
    // );
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
