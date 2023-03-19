// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { modelCost } from "../../../lib/api/metrics/costCalc";
import { getModelMetricsForUsers } from "../../../lib/api/metrics/modelMetrics";

import { UserMetric, userMetrics } from "../../../lib/api/users/users";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<UserMetric[], string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { filter, offset, limit } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
  };
  const { error: metricsError, data: metrics } = await userMetrics(
    user.data.user.id,
    filter,
    offset,
    limit
  );
  if (metricsError !== null) {
    res.status(500).json({ error: metricsError, data: null });
    return;
  }

  const userIds = metrics?.map((metric) => metric.user_id) ?? [];
  console.log("userIds", userIds);
  const { error: userCostError, data: userCosts } =
    await getModelMetricsForUsers(filter, user.data.user.id, false, userIds);
  console.log("userCosts", userCosts);

  const costByUser =
    userCosts?.reduce(
      (
        acc: {
          [key: string]: number;
        },
        userCost
      ) => {
        const userMetric = acc[userCost.user_id];
        if (userMetric !== undefined) {
          acc[userCost.user_id] += modelCost({
            model: userCost.model,
            sum_tokens: userCost.sum_tokens,
            prompt_tokens: userCost.prompt_tokens,
            completion_tokens: userCost.completion_tokens,
          });
        } else {
          acc[userCost.user_id] = modelCost({
            model: userCost.model,
            sum_tokens: userCost.sum_tokens,
            prompt_tokens: userCost.prompt_tokens,
            completion_tokens: userCost.completion_tokens,
          });
        }
        return acc;
      },
      {}
    ) ?? {};
  for (const metric of metrics ?? []) {
    metric.cost = costByUser[metric.user_id];
  }

  res.status(200).json({ error: null, data: metrics });
}
