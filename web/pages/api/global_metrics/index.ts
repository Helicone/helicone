// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute } from "../../../lib/api/db/dbExecute";

import { getMetrics, Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<number[], string>>
) {
  res
    .status(200)
    .json(await dbExecute<number>("select count(*) from request", []));
}
