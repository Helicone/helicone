import { buildFilterWithAuth } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import {
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { dbExecute } from "../db/dbExecute";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export interface FeedbackOverTime {
  created_at_trunc: Date;
  count: number;
  is_thumbs_up: boolean;
}

export async function getFeedbackOverTime({
  timeFilter,
  userFilter,
  orgId,
  dbIncrement,
  timeZoneDifference,
}: DataOverTimeRequest): Promise<Result<FeedbackOverTime[], string>> {
  if (!isValidTimeIncrement(dbIncrement)) {
    return { data: null, error: "Invalid time increment" };
  }
  if (!isValidTimeZoneDifference(timeZoneDifference)) {
    return { data: null, error: "Invalid time zone difference" };
  }
  const builtFilter = await buildFilterWithAuth({
    filter: userFilter,
    argsAcc: [],
    org_id: orgId,
  });
  const dateTrunc = `DATE_TRUNC('${dbIncrement}', feedback.created_at + INTERVAL '${timeZoneDifference} minutes')`;
  const query = `
  SELECT
    feedback.is_thumbs_up,
    ${dateTrunc} as created_at_trunc,
    COUNT(feedback.id) AS count
  FROM public.feedback
  WHERE (
    feedback.created_at IS NOT NULL
    AND (${builtFilter.filter})
  )
  GROUP BY feedback.is_thumbs_up, ${dateTrunc}
  ORDER BY ${dateTrunc}
  `;
  const { data, error } = await dbExecute<FeedbackOverTime>(
    query,
    builtFilter.argsAcc
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return {
    data: data.map((d) => ({
      ...d,
      created_at_trunc: new Date(
        d.created_at_trunc.getTime() - timeZoneDifference * 60 * 1000
      ),
    })),
    error: null,
  };
}
