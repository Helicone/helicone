import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import { DateCountDBModel } from "../schema/dateCount";
import { Result } from "./result";
export interface TimeData {
  time: Date;
  count: number;
}

function timeBackfill(
  data: DateCountDBModel[],
  start: Date,
  end: Date,
  increment: (date: Date) => Date
): TimeData[] {
  const result: TimeData[] = [];
  let current = start;

  while (current < end) {
    const nextTime = increment(current);

    const count =
      data.find(
        (d) =>
          nextTime.getTime() >= d.created_at_trunc.getTime() &&
          d.created_at_trunc.getTime() > current.getTime()
      )?.count ?? 0;
    result.push({ time: nextTime, count });
    current = nextTime;
  }
  return result;
}

export type TimeIncrement = "min" | "hour" | "day" | "week" | "month" | "year";
async function fetchTimeData(
  client: SupabaseClient,
  timeIncrement: TimeIncrement,
  start: Date
): Promise<Result<DateCountDBModel[], PostgrestError>> {
  const { data: tempDateCount, error: dataCountError } = await client.rpc(
    "date_count",
    {
      time_increment: timeIncrement,
      prev_period: start.toISOString(),
    }
  );
  if (dataCountError !== null) {
    return { data: null, error: dataCountError };
  }
  const dateCount: DateCountDBModel[] = tempDateCount.map((d) => ({
    created_at_trunc: new Date(d.created_at_trunc),
    count: d.count,
  }));
  return { data: dateCount, error: null };
}

export async function fetchLastXTimeData(
  client: SupabaseClient,
  dbIncrement: TimeIncrement,
  increment: (date: Date) => Date,
  start: Date,
  end: Date
): Promise<Result<TimeData[], string>> {
  const { data: dateCount, error: dataCountError } = await fetchTimeData(
    client,
    dbIncrement,
    start
  );
  if (dataCountError !== null) {
    return { data: null, error: dataCountError.message };
  }

  return {
    data: timeBackfill(dateCount, start, end, increment),
    error: null,
  };
}
