// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import {
  getProperties,
  Property,
} from "../../../lib/api/properties/properties";
import { Result } from "../../../lib/shared/result";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<Property[], string>>) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const properties = await getProperties(orgId);
  res.status(properties.error === null ? 200 : 500).json(properties);
}

export default withAuth(handler);
