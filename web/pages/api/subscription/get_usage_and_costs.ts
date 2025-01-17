import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { getRequestCountClickhouse } from "../../../lib/api/request/request";
import { handleLogCostCalculation } from "../../../utils/LogCostCalculation";

async function handler({
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<Object, string>>) {
  const { data, error } = await supabaseServer
    .from("organization")
    .select("stripe_subscription_id, stripe_subscription_item_id, tier")
    .eq("id", orgId)
    .single();
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
      `https://api.stripe.com/v1/subscription_items/${data.stripe_subscription_item_id}`,
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

  // if (data.tier == "growth") {
  //   return res.status(200).json({
  //     data: {
  //       currentPeriodStart: subscriptionData.current_period_start,
  //       currentPeriodEnd: subscriptionData.current_period_end,
  //       totalCost:
  //         subscriptionItem.quantity * subscriptionItem.price.unit_amount,
  //     },
  //     error: null,
  //   });

  if (data.tier == "growth") {
    const requestCount = await getRequestCountClickhouse(orgId, {
      left: {
        request_response_rmt: {
          request_created_at: {
            gte: new Date(subscriptionData.current_period_start * 1000),
          },
        },
      },
      right: {
        request_response_rmt: {
          request_created_at: {
            lt: new Date(subscriptionData.current_period_end * 1000),
          },
        },
      },
      operator: "and",
    });

    const tieredCostCalculation = handleLogCostCalculation(
      requestCount?.data || 0
    );
    return res.status(200).json({
      data: {
        currentPeriodStart: subscriptionData.current_period_start,
        currentPeriodEnd: subscriptionData.current_period_end,
        totalCost: tieredCostCalculation,
      },
      error: null,
    });
  }
}

export default withAuth(handler);
