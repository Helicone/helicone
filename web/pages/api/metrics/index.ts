// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { getMetrics, Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/shared/result";
import { FilterNode } from "../../../lib/shared/filters/filterDefs";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";

async function handler(
  options: HandlerWrapperOptions<Result<Metrics, string>>
) {
  const { req, res, userData, supabaseClient } = options;
  const filter = req.body as FilterNode;

  // if (!filter) {
  //   res.status(400).json({ error: "Bad request", data: null });
  //   return;
  // }

  // const metrics = await getMetrics(
  //   {
  //     client: supabaseClient.getClient(),
  //     orgId: userData.orgId,
  //   },
  //   {
  //     filter,
  //   }
  // );
  // res.status(200).json(metrics);
}

export default withAuth(handler);
