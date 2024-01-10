// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute, dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { Result } from "../../lib/shared/result";

type CountOverTime = {
  count_step: number;
  time_step: Date;
};
type WeeklyActiveIntegrations = {
  request_count_step: number;
  user_count_step: number;
  time_step: Date;
};

type RetentionAndChurnRate = {
  time_step: Date;
  rate: number;
};

export interface HeliconeStats {
  weeklyActiveUsers: WeeklyActiveIntegrations[];
  monthlyActiveUsers: WeeklyActiveIntegrations[];
  dailyActiveUsers: WeeklyActiveIntegrations[];
  integratedUsers: CountOverTime[];
  growthOverTime: CountOverTime[];
  growthPerMonth: CountOverTime[];
  growthPerWeek: CountOverTime[];
  monthlyChurnRate: RetentionAndChurnRate[];
  weeklyChurnRate: RetentionAndChurnRate[];
  monthlyRetentionRate: RetentionAndChurnRate[];
  weeklyRetentionRate: RetentionAndChurnRate[];
  weeklyUserBounceRate: RetentionAndChurnRate[];
}

export async function getModelUsageOverTime(): Promise<
  Result<HeliconeStats, string>
> {
  const weeklyActiveUsersQuery = `
  SELECT date_trunc('week'::text, request_created_at) AS time_step,
    count(DISTINCT response_copy_v3.organization_id) AS user_count_step,
    count(response_copy_v3.request_id) AS request_count_step
  FROM response_copy_v3
  GROUP BY (date_trunc('week'::text, request_created_at))
  ORDER BY (date_trunc('week'::text, request_created_at)) DESC;
`;
  const monthlyActiveUsersQuery = `
SELECT date_trunc('month'::text, request_created_at) AS time_step,
  count(DISTINCT response_copy_v3.organization_id) AS user_count_step,
  count(response_copy_v3.request_id) AS request_count_step
FROM response_copy_v3
GROUP BY (date_trunc('month'::text, request_created_at))
ORDER BY (date_trunc('month'::text, request_created_at)) DESC;
`;

  const dailyActiveUsersQuery = `
SELECT date_trunc('day'::text, request_created_at) AS time_step,
  count(DISTINCT response_copy_v3.organization_id) AS user_count_step,
  count(response_copy_v3.request_id) AS request_count_step
FROM response_copy_v3
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

  const growthPerMonthQuery = `
SELECT
date_trunc('month', u.created_at) AS time_step,
COUNT(u.id) AS count_step
FROM
  auth.users u
GROUP BY
  date_trunc('month', u.created_at)
ORDER BY
time_step DESC;`;

  const growthPerWeekQuery = `
SELECT
date_trunc('week', u.created_at) AS time_step,
COUNT(u.id) AS count_step
FROM
  auth.users u
GROUP BY
  date_trunc('week', u.created_at)
ORDER BY
time_step DESC;`;

  const monthlyRetentionRateQuery = `
SELECT 
    DATE_TRUNC('month', u.created_at) AS time_step,
    COUNT(DISTINCT CASE WHEN u.last_sign_in_at >= DATE_TRUNC('month', u.created_at) + INTERVAL '1 month' THEN u.id END)::float / COUNT(DISTINCT u.id)::float AS rate
FROM
    auth.users u
WHERE
    u.last_sign_in_at - u.created_at > INTERVAL '1 day'
GROUP BY 
    DATE_TRUNC('month', u.created_at)
ORDER BY 
    time_step DESC;
`;

  const weeklyRetentionRateQuery = `
SELECT 
    DATE_TRUNC('week', u.created_at) AS time_step,
    COUNT(DISTINCT CASE WHEN u.last_sign_in_at >= DATE_TRUNC('week', u.created_at) + INTERVAL '1 week' THEN u.id END)::float / COUNT(DISTINCT u.id)::float AS rate
FROM
    auth.users u
WHERE
    u.last_sign_in_at - u.created_at > INTERVAL '1 day'
GROUP BY 
    DATE_TRUNC('week', u.created_at)
ORDER BY 
    time_step DESC;
`;

  const monthlyChurnRateQuery = `
SELECT 
    DATE_TRUNC('month', u.created_at) AS time_step,
    COUNT(DISTINCT CASE WHEN u.last_sign_in_at < DATE_TRUNC('month', u.created_at) + INTERVAL '1 month' THEN u.id END)::float / COUNT(DISTINCT u.id)::float AS rate
FROM
    auth.users u
WHERE
    u.last_sign_in_at - u.created_at > INTERVAL '1 day'
GROUP BY 
    DATE_TRUNC('month', u.created_at)
ORDER BY 
    time_step DESC;
`;

  const weeklyChurnRateQuery = `
SELECT 
    DATE_TRUNC('week', u.created_at) AS time_step,
    COUNT(DISTINCT CASE WHEN u.last_sign_in_at < DATE_TRUNC('week', u.created_at) + INTERVAL '1 week' THEN u.id END)::float / COUNT(DISTINCT u.id)::float AS rate
FROM
    auth.users u
WHERE
    u.last_sign_in_at - u.created_at > INTERVAL '1 day'
GROUP BY 
    DATE_TRUNC('week', u.created_at)
ORDER BY 
    time_step DESC;
`;

  const weeklyUserBounceRateQuery = `
SELECT 
    DATE_TRUNC('week', u.created_at) AS time_step,
    COUNT(DISTINCT CASE WHEN u.last_sign_in_at < DATE_TRUNC('week', u.created_at) + INTERVAL '1 week' THEN u.id END)::float / COUNT(DISTINCT u.id)::float AS rate
FROM
    auth.users u
WHERE 
    u.last_sign_in_at - u.created_at < INTERVAL '1 day'
GROUP BY 
    DATE_TRUNC('week', u.created_at)
ORDER BY 
    time_step DESC;
`;

  // const newUsersOverTimeQuery = `
  // WITH users_with_api_keys AS (

  const [
    { data: integratedUsers, error: integratedUsersError },
    { data: weeklyActiveUsers, error: weeklyActiveUsersError },
    { data: monthlyActiveUsers, error: monthlyActiveUsersError },
    { data: dailyActive, error: dailyActiveError },
    { data: growthOverTime, error: growthOverTimeError },
    { data: growthPerMonth, error: growthPerMonthError },
    { data: growthPerWeek, error: growthPerWeekError },
    { data: monthlyRetentionRate, error: monthlyRetentionRateError },
    { data: weeklyRetentionRate, error: weeklyRetentionRateError },
    { data: monthlyChurnRate, error: monthlyChurnRateError },
    { data: weeklyChurnRate, error: weeklyChurnRateError },
    { data: weeklyUserBounceRate, error: weeklyUserBounceRateError },
  ] = await Promise.all([
    dbExecute<CountOverTime>(usersOverTimeQuery, []),
    dbQueryClickhouse<WeeklyActiveIntegrations>(weeklyActiveUsersQuery, []),
    dbQueryClickhouse<WeeklyActiveIntegrations>(monthlyActiveUsersQuery, []),
    dbQueryClickhouse<WeeklyActiveIntegrations>(dailyActiveUsersQuery, []),
    dbExecute<CountOverTime>(growthOverTimeQuery, []),
    dbExecute<CountOverTime>(growthPerMonthQuery, []),
    dbExecute<CountOverTime>(growthPerWeekQuery, []),
    dbExecute<RetentionAndChurnRate>(monthlyRetentionRateQuery, []),
    dbExecute<RetentionAndChurnRate>(weeklyRetentionRateQuery, []),
    dbExecute<RetentionAndChurnRate>(monthlyChurnRateQuery, []),
    dbExecute<RetentionAndChurnRate>(weeklyChurnRateQuery, []),
    dbExecute<RetentionAndChurnRate>(weeklyUserBounceRateQuery, []),
  ]);

  if (integratedUsersError !== null) {
    return { data: null, error: integratedUsersError };
  }

  if (weeklyActiveUsersError !== null) {
    return { data: null, error: weeklyActiveUsersError };
  }

  if (monthlyActiveUsersError !== null) {
    return { data: null, error: monthlyActiveUsersError };
  }

  if (dailyActiveError !== null) {
    return { data: null, error: dailyActiveError };
  }

  if (growthOverTimeError !== null) {
    return { data: null, error: growthOverTimeError };
  }

  if (growthPerMonthError !== null) {
    return { data: null, error: growthPerMonthError };
  }

  if (growthPerWeekError !== null) {
    return { data: null, error: growthPerWeekError };
  }

  if (monthlyRetentionRateError !== null) {
    return { data: null, error: monthlyRetentionRateError };
  }

  if (weeklyRetentionRateError !== null) {
    return { data: null, error: weeklyRetentionRateError };
  }

  if (monthlyChurnRateError !== null) {
    return { data: null, error: monthlyChurnRateError };
  }

  if (weeklyChurnRateError !== null) {
    return { data: null, error: weeklyChurnRateError };
  }

  if (weeklyUserBounceRateError !== null) {
    return { data: null, error: weeklyUserBounceRateError };
  }

  return {
    data: {
      weeklyActiveUsers: weeklyActiveUsers!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      monthlyActiveUsers: monthlyActiveUsers!.map((d) => ({
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
      growthPerMonth: growthPerMonth!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      growthPerWeek: growthPerWeek!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      monthlyRetentionRate: monthlyRetentionRate!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      weeklyRetentionRate: weeklyRetentionRate!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      monthlyChurnRate: monthlyChurnRate!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      weeklyChurnRate: weeklyChurnRate!.map((d) => ({
        ...d,
        time_step: new Date(d.time_step),
      })),
      weeklyUserBounceRate: weeklyUserBounceRate!.map((d) => ({
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
