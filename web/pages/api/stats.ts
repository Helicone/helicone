// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute } from "../../lib/api/db/dbExecute";
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
  integratedUsers: CountOverTime[];
}

export async function getModelUsageOverTime(): Promise<
  Result<HeliconeStats, string>
> {
  const integratedUsersQuery = `
  WITH users_with_api_keys AS (
    SELECT DISTINCT
      u.id as user_id,
      u.created_at
    FROM
      auth.users u
  ),
  aggregated_data AS (
    SELECT
      date_trunc('day', created_at) AS hour,
      COUNT(*) AS new_users_with_api_keys
    FROM
      users_with_api_keys
    GROUP BY
      date_trunc('day', created_at)
  )
  SELECT
      all_hours.hour as time_step,
      (SUM(COALESCE(aggregated_data.new_users_with_api_keys, 0)) OVER (ORDER BY all_hours.hour))::bigint AS count_step
  FROM
      generate_series(
        (SELECT MIN(hour) FROM aggregated_data),
        (SELECT MAX(hour) FROM aggregated_data),
        INTERVAL '1 day'
      ) AS all_hours(hour)
  LEFT JOIN
      aggregated_data ON all_hours.hour = aggregated_data.hour
  ORDER BY
      all_hours.hour;
`;
  const { data: integratedUsers, error: integratedUsersError } =
    await dbExecute<CountOverTime>(integratedUsersQuery, []);

  if (integratedUsersError !== null) {
    return { data: null, error: integratedUsersError };
  }

  const weeklyActiveUsersQuery = `
SELECT
  *
FROM
  weekly_active_integrations
`;

  const { data: weeklyActiveUsers, error: weeklyActiveUsersError } =
    await dbExecute<WeeklyActiveIntegrations>(weeklyActiveUsersQuery, []);

  if (weeklyActiveUsersError !== null) {
    return { data: null, error: weeklyActiveUsersError };
  }

  return {
    data: {
      weeklyActiveUsers: weeklyActiveUsers.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      integratedUsers: integratedUsers.map((d) => ({
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
  res.status(200).json(await getModelUsageOverTime());
}
