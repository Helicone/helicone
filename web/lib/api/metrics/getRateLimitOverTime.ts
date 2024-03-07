import { RateLimitOverTime } from "../../../pages/api/metrics/rateLimitsOverTime";
import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getRateLimitOverTime(
  data: DataOverTimeRequest,
  groupByColumns: string[] = [],
  printQuery = false
): Promise<Result<RateLimitOverTime[], string>> {
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
