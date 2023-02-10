import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Result } from "../../../lib/result";

import { deleteSubscription } from "../../../lib/api/subscription/delete";
import { getSubscriptions } from "../../../lib/api/subscription/get";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";
import { Tier } from "../../../components/templates/usage/usagePage";
type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

export type UserSettingsResponse = {
  user_settings: UserSettings;
  subscription?: Stripe.Subscription;
};
async function getOrCreateUserSettings(
  user: User
): Promise<Result<UserSettings, string>> {
  const { data: userSettings, error: userSettingsError } = await supabaseServer
    .from("user_settings")
    .select("*")
    .eq("user", user.id)
    .single();
  if (userSettingsError !== null || userSettings === null) {
    const { error: createUserSettingsError, data: createUserSettingsData } =
      await supabaseServer
        .from("user_settings")
        .insert({
          user: user.id,
        })
        .select("*")
        .single();
    if (createUserSettingsError !== null) {
      return { data: null, error: createUserSettingsError.message };
    } else {
      return {
        data: createUserSettingsData,
        error: null,
      };
    }
  } else {
    return { data: userSettings, error: null };
  }
}

async function syncSettingsWithStripe(
  userSettings: UserSettings,
  subscriptions: Stripe.Subscription[]
): Promise<Result<undefined, string>> {
  if (userSettings.tier === "enterprise") {
    return { data: undefined, error: null };
  } else {
    const activeSubscription = subscriptions.find((subscription) => {
      if (subscription.status === "active") {
        return true;
      }
    });
    const isPendingCancellation =
      activeSubscription?.cancel_at_period_end === true;
    if (isPendingCancellation) {
      const tier: Tier = "pro-pending-cancel";
      const userSetting = await supabaseServer
        .from("user_settings")
        .update({
          tier: tier,
        })
        .eq("user", userSettings.user)
        .select("*")
        .single();
      if (userSetting.error !== null) {
        return { data: null, error: userSetting.error.message };
      } else {
        return { data: undefined, error: null };
      }
    } else {
      const tier: Tier = activeSubscription ? "pro" : "free";
      const userSetting = await supabaseServer
        .from("user_settings")
        .update({
          tier: tier,
        })
        .eq("user", userSettings.user)
        .select("*")
        .single();
      if (userSetting.error !== null) {
        return { data: null, error: userSetting.error.message };
      } else {
        return { data: undefined, error: null };
      }
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserSettingsResponse | string>
) {
  if (req.method === "GET") {
    const client = createServerSupabaseClient({ req, res });

    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError !== null) {
      console.error(userError);
      res.status(500).json(userError.message);
      return;
    }
    if (user === null) {
      console.error("User not found");
      res.status(404).json("User not found");
      return;
    }

    const { data: userSettings, error: userSettingsError } =
      await getOrCreateUserSettings(user);

    if (userSettingsError !== null) {
      res.status(500).json(userSettingsError);
      return;
    }
    if (userSettings === null) {
      res.status(404).json("User settings not found");
      return;
    }
    const { data: subscriptions, error: subscriptionError } =
      await getSubscriptions(req, res);

    const syncSettingsWithStripeResult = await syncSettingsWithStripe(
      userSettings,
      subscriptions ?? []
    );
    if (syncSettingsWithStripeResult.error !== null) {
      res.status(500).json(syncSettingsWithStripeResult.error);
      return;
    }

    if (subscriptionError !== null) {
      res.status(500).json(subscriptionError);
      return;
    }

    if (subscriptions !== null && subscriptions.length > 0) {
      const subscription = subscriptions[0];
      if (subscription.status === "active") {
        res.status(200).json({
          user_settings: userSettings,
          subscription,
        });
        return;
      }
    }

    return res.status(200).json({
      user_settings: userSettings,
    });
  } else {
    res.setHeader("Allow", "GET");
    res.status(405).end("Method Not Allowed");
  }
}
