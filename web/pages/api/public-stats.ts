// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute, dbQueryClickhouse } from "../../lib/api/db/dbExecute";
import { ok } from "../../lib/result";

export async function getModelUsageOverTime() {
  const LastMonthStatsQuery = `
SELECT 
  count(DISTINCT request_response_rmt.organization_id) AS count_step,
  count(request_response_rmt.request_id) AS request_count_step
FROM request_response_rmt
WHERE created_at > now() - INTERVAL '1 month'
`;

  const getUserCountQuery = `
SELECT
  COUNT(DISTINCT u.id) AS count
FROM
  auth.users u
`;

  const getTotalRequestCountQuery = `
SELECT
  COUNT(*) AS count
FROM
request_response_rmt
`;

  const [
    { data: lastMonthStats, error: lastMonthStatsError },
    { data: userCount, error: userCountError },
    { data: requestCount, error: requestCountError },
  ] = await Promise.all([
    dbQueryClickhouse<{
      count_step: number;
      request_count_step: number;
    }>(LastMonthStatsQuery, []),
    dbExecute<{
      count: number;
    }>(getUserCountQuery, []),
    dbQueryClickhouse<{
      count: number;
    }>(getTotalRequestCountQuery, []),
  ]);

  if (lastMonthStatsError !== null) {
    return { data: null, error: lastMonthStatsError };
  }

  if (userCountError !== null) {
    return { data: null, error: userCountError };
  }

  if (requestCountError !== null) {
    return { data: null, error: requestCountError };
  }
  let monthlyRequests = lastMonthStats?.[0].request_count_step ?? 0;
  monthlyRequests = Math.floor(monthlyRequests / 1_000_000) * 1_000_000;
  let monthlyActiveCompanies = lastMonthStats?.[0].count_step ?? 0;
  monthlyActiveCompanies = Math.floor(monthlyActiveCompanies / 100) * 100;
  let totalUsers = userCount?.[0].count ?? 0;
  totalUsers = Math.floor(totalUsers / 1_000) * 1_000;
  let totalRequests = requestCount?.[0].count ?? 0;
  totalRequests = Math.floor(totalRequests / 1_000_000) * 1_000_000;

  return ok({
    monthlyRequests,
    monthlyActiveCompanies,
    totalUsers,
    totalRequests,
  });
}
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export type PublicHeliconeStatsResult = Awaited<
  ReturnType<typeof getModelUsageOverTime>
>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicHeliconeStatsResult>
) {
  res.setHeader("Cache-Control", `s-maxage=${60 * 60 * 24 * 2}, public`); // 2 days

  res.status(200).json(await getModelUsageOverTime());
}
