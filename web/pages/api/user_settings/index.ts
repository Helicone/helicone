import { User } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Result } from "../../../lib/result";

import { getSubscriptions } from "../../../lib/api/subscription/get";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";
// import { Tier } from "../../../components/templates/usage/usagePage";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
// import { REQUEST_LIMITS } from "../../../lib/constants";
type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

export type UserSettingsResponse = {
  user_settings: UserSettings;
  subscription?: Stripe.Subscription;
};

export async function getOrCreateUserSettings(
  user: User
): Promise<Result<UserSettings, string>> {
  const { data: userSettings, error: userSettingsError } =
    await supabaseServer()
      .from("user_settings")
      .select("*")
      .eq("user", user.id)
      .single();

  if (userSettings === null) {
    // add the user into the userSettings page
    const { data: newUserSettings, error: newUserSettingsError } =
      await supabaseServer()
        .from("user_settings")
        .insert({
          user: user.id,
          tier: "free",
          request_limit: 100_000,
        })
        .select("*")
        .single();

    if (newUserSettingsError) {
      return {
        data: null,
        error: newUserSettingsError.message,
      };
    }

    return {
      data: newUserSettings,
      error: null,
    };
  }

  return {
    data: userSettings,
    error: null,
  };
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
