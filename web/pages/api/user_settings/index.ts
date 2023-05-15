import { User } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Result } from "../../../lib/result";

import { getSubscriptions } from "../../../lib/api/subscription/get";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";
// import { Tier } from "../../../components/templates/usage/usagePage";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import { stripeServer } from "../../../utlis/stripeServer";
// import { REQUEST_LIMITS } from "../../../lib/constants";
type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

export type UserSettingsResponse = {
  user_settings: UserSettings;
  subscription?: Stripe.Subscription;
};

export async function getOrCreateUserSettings(
  user: User
): Promise<Result<UserSettings, string>> {
  const { data: userSettings, error: userSettingsError } = await supabaseServer
    .from("user_settings")
    .select("*")
    .eq("user", user.id)
    .single();
  const customer = await stripeServer.customers.list({
    email: user.email,
    limit: 1,
  });
  // Convert all free users to basic flex users
  if (userSettings?.tier === "free" || customer.data.length === 0) {
    const { error: updateUserSettingsError, data: updateUserSettingsData } =
      await supabaseServer
        .from("user_settings")
        .update({
          tier: "basic_flex",
        })
        .eq("user", user.id)
        .select("*")
        .single();
    if (updateUserSettingsError !== null) {
      return { data: null, error: updateUserSettingsError.message };
    } else {
      // create a new account in stripe
      const createParams: Stripe.CustomerCreateParams = {
        email: user.email,
        name: user.email,
        expand: ["subscriptions"],
      };

      const customer = await stripeServer.customers.create(createParams);

      // Subscribe the customer to the basic_flex plan
      const subParams: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: process.env.STRIPE_BASIC_FLEX_PRICE_ID }],
      };

      await stripeServer.subscriptions.create(subParams);

      return {
        data: updateUserSettingsData,
        error: null,
      };
    }
  } else if (userSettingsError !== null || userSettings === null) {
    const { error: createUserSettingsError, data: createUserSettingsData } =
      await supabaseServer
        .from("user_settings")
        .insert({
          user: user.id,
          tier: "basic_flex",
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserSettingsResponse | string>
) {
  if (req.method === "GET") {
    const client = new SupabaseServerWrapper({ req, res }).getClient();

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
