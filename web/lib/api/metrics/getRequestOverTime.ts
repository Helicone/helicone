import { Result, resultMap } from "../../result";

import { RequestsOverTime } from "../../timeCalculations/fetchTimeData";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

/**
 * Retrieves the total requests over time based on the provided data and grouping columns.
 *
 * @param data - The data for the request over time.
 * @param groupByColumns - The columns to group the requests by (optional).
 * @param printQuery - Indicates whether to print the query (optional, default: false).
 * @returns A promise that resolves to a Result object containing the requests over time or an error message.
 */
export async function getTotalRequestsOverTime(
  data: DataOverTimeRequest,
  groupByColumns: string[] = [],
  printQuery = false
): Promise<Result<RequestsOverTime[], string>> {
  const res = await getXOverTime<{
    count: number;
    status: number;
  }>(data, "count(*) as count", groupByColumns, printQuery);
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.count),
      status: Number(d.status),
    }))
  );
}
