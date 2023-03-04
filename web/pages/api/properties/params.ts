// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

import {
  getProperties,
  Property,
} from "../../../lib/api/properties/properties";
import {
  getPropertyParams,
  PropertyParam,
} from "../../../lib/api/properties/propertyParams";
import { Result } from "../../../lib/result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<PropertyParam[], string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const properties = await getPropertyParams(user.data.user.id);
  res.status(properties.error === null ? 200 : 500).json(properties);
}
