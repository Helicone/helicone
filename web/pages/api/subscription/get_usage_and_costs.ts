import { PostgrestSingleResponse } from "@supabase/postgrest-js";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Tier } from "../organization/tier";

async function handler({
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<Object, string>>) {
  const { data, error } = (await supabaseServer
    .from("organization")
    .select("stripe_subscription_id, stripe_subscription_item_id, tier")
    .eq("id", orgId)
    .single()) as PostgrestSingleResponse<{
    stripe_subscription_id: string | null;
    stripe_subscription_item_id: string | null;
    tier: Tier;
  }>;
  if (error) {
    return res.status(500).json({
      data: null,
      error: error.message,
    });
  }
  if (data.tier == "free") {
    return res.status(200).json({
      data: null,
      error: "You are on the free tier",
    });
  }

  const [subDataRes, subItemRes] = await Promise.all([
    fetch(
      `https://api.stripe.com/v1/subscriptions/${data.stripe_subscription_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      }
    ),
    fetch(
      `https://api.stripe.com/v1/subscription_items/${data.stripe_subscription_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      }
    ),
  ]);

  const [subscriptionData, subscriptionItem] = await Promise.all([
    subDataRes.json(),
    subItemRes.json(),
  ]);
  console.log(
    subscriptionItem.price.billing_scheme,
    subscriptionItem.price.unit_amount,
    subscriptionItem.quantity
  );
  return res.status(200).json({
    data: {
      currentPeriodStart: subscriptionData.current_period_start,
      currentPeriodEnd: subscriptionData.current_period_end,
      usageAmount: subscriptionItem.quantity,
      totalCost: subscriptionItem.price.unit_amount * subscriptionItem.quantity,
    },
    error: null,
  });
}

export default withAuth(handler);
