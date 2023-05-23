// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute, dbQueryClickhouse } from "../../lib/api/db/dbExecute";
import { Result } from "../../lib/result";

type CountOverTime = {
  count_step: number;
  time_step: Date;
};
type WeeklyActiveIntegrations = {
  request_count_step: number;
  user_count_step: number;
  time_step: Date;
};

export interface HeliconeStats {
  weeklyActiveUsers: WeeklyActiveIntegrations[];
  dailyActiveUsers: WeeklyActiveIntegrations[];
  integratedUsers: CountOverTime[];
  growthOverTime: CountOverTime[];
}

export async function getModelUsageOverTime(): Promise<
  Result<HeliconeStats, string>
> {
  const weeklyActiveUsersQuery = `
  SELECT date_trunc('week'::text, request_created_at) AS time_step,
    count(DISTINCT response_copy_v2.organization_id) AS user_count_step,
    count(response_copy_v2.request_id) AS request_count_step
  FROM response_copy_v2
  GROUP BY (date_trunc('week'::text, request_created_at))
  ORDER BY (date_trunc('week'::text, request_created_at)) DESC;
`;
  const dailyActiveUsersQuery = `
SELECT date_trunc('day'::text, request_created_at) AS time_step,
  count(DISTINCT response_copy_v2.organization_id) AS user_count_step,
  count(response_copy_v2.request_id) AS request_count_step
FROM response_copy_v2
GROUP BY (date_trunc('day'::text, request_created_at))
ORDER BY (date_trunc('day'::text, request_created_at)) DESC;
`;

  const usersOverTimeQuery = `
  WITH aggregated_data AS (
    SELECT
      date_trunc('day', u.created_at) AS day,
      COUNT(u.id) AS new_users
    FROM
      auth.users u
    GROUP BY
      date_trunc('day', u.created_at)
  )
  SELECT
      all_days.day AS time_step,
      (SUM(COALESCE(aggregated_data.new_users, 0)) OVER (ORDER BY all_days.day))::bigint AS count_step
  FROM
      generate_series(
        (SELECT MIN(day) FROM aggregated_data),
        (SELECT MAX(day) FROM aggregated_data),
        INTERVAL '1 day'
      ) AS all_days(day)
  LEFT JOIN
      aggregated_data ON all_days.day = aggregated_data.day
  ORDER BY
      all_days.day;
`;

  const growthOverTimeQuery = `
SELECT
date_trunc('day', u.created_at) AS time_step,
COUNT(u.id) AS count_step
FROM
  auth.users u
GROUP BY
  date_trunc('day', u.created_at)
ORDER BY
time_step DESC;`;

  // const newUsersOverTimeQuery = `
  // WITH users_with_api_keys AS (

  const [
    { data: integratedUsers, error: integratedUsersError },
    { data: weeklyActiveUsers, error: weeklyActiveUsersError },
    { data: dailyActive, error: dailyActiveError },
    { data: growthOverTime, error: growthOverTimeError },
  ] = await Promise.all([
    dbExecute<CountOverTime>(usersOverTimeQuery, []),
    dbQueryClickhouse<WeeklyActiveIntegrations>(weeklyActiveUsersQuery, []),
    dbQueryClickhouse<WeeklyActiveIntegrations>(dailyActiveUsersQuery, []),
    dbExecute<CountOverTime>(growthOverTimeQuery, []),
  ]);

  if (integratedUsersError !== null) {
    return { data: null, error: integratedUsersError };
  }

  if (weeklyActiveUsersError !== null) {
    return { data: null, error: weeklyActiveUsersError };
  }

  if (dailyActiveError !== null) {
    return { data: null, error: dailyActiveError };
  }

  if (growthOverTimeError !== null) {
    return { data: null, error: growthOverTimeError };
  }

  return {
    data: {
      weeklyActiveUsers: weeklyActiveUsers!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      integratedUsers: integratedUsers!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      dailyActiveUsers: dailyActive!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      growthOverTime: growthOverTime!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
    },
    error: null,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<HeliconeStats, string>>
) {
  res.setHeader("Cache-Control", `s-maxage=${60 * 10}, public`); // 10 minutes

  res.status(200).json(await getModelUsageOverTime());
}
