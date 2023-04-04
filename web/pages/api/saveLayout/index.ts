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
import {
  stripeEnterpriseProductId,
  stripeStarterProductId,
} from "../checkout_sessions";
import { ColumnFormatted } from "../../../components/shared/themed/themedTableV3";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { UIFilterRow } from "../../../components/shared/themed/themedAdvancedFilters";
type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
type Layout = Database["public"]["Tables"]["layout"]["Row"];

export type UserSettingsResponse = {
  user_settings: UserSettings;
  subscription?: Stripe.Subscription;
};

interface Filters {
  advancedFilter: UIFilterRow[];
  timeFIlter: FilterNode;
}

async function saveLayout(
  user: User,
  columns: ColumnFormatted[],
  filters: Filters,
): Promise<Result<Layout, string>> {
  console.log("HEY SAVE")
  console.log("USER ID", user.id)
  const { data, error } = await supabaseServer
    .from('layout')
    .insert([{
        user: user.id,
        filters: JSON.stringify(filters),
        columns: JSON.stringify(columns),
        name: "BLAH!"
    }])
    .select("*")
    .single();

  console.log("DATA", data, "ERROR", error)

  if (error !== null) {
    return { data: null, error: error.message };
  }

  return { data: data, error: null };
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Layout | string>
) {

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { columns, filters } = req.body;

  if (!columns || !filters) {
    res.status(400).json('Bad Request: columns and filters are required');
    return;
  }

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

  try {
    const layoutData = await saveLayout(user, columns, filters);
    if (!layoutData.data) {
      res.status(500).json('Error inserting layout');
      return;
    }
    res.status(200).json(layoutData.data);
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json('Internal Server Error');
  }
}
