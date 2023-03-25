import { Pool } from "pg";
import Papa, { unparse } from "papaparse";
import { NextApiRequest, NextApiResponse } from "next";
import { getRequests } from "../../../../lib/api/request/request";
import { FilterNode } from "../../../../services/lib/filters/filterDefs";
import { SortLeafRequest } from "../../../../services/lib/sorts/sorts";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { userMetrics } from "../../../../lib/api/users/users";
import { getModelMetricsForUsers } from "../../../../lib/api/metrics/modelMetrics";
import { modelCost } from "../../../../lib/api/metrics/costCalc";

interface FlatObject {
  [key: string]: string | number | boolean | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { filter, offset, limit, sort } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    sort: SortLeafRequest;
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

  const { error: userCostError, data: userCosts } =
    await getModelMetricsForUsers(filter, user.data.user.id, false, userIds);

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

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=export.csv");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  function flattenJSON(jsonObj: any, prefix = "", depth = 0): FlatObject {
    const flattened: FlatObject = {};

    for (const key in jsonObj) {
      if (jsonObj.hasOwnProperty(key)) {
        const newPrefix = prefix ? prefix + "." + key : key;

        if (
          typeof jsonObj[key] === "object" &&
          jsonObj[key] !== null &&
          depth < 3
        ) {
          Object.assign(
            flattened,
            flattenJSON(jsonObj[key], newPrefix, depth + 1)
          );
        } else {
          flattened[newPrefix] = jsonObj[key];
        }
      }
    }

    return flattened;
  }

  const flattened = metrics?.map((item) => flattenJSON(item));

  const csvData = Papa.unparse(flattened || []);

  res.status(metricsError === null ? 200 : 500).send(csvData);
}
