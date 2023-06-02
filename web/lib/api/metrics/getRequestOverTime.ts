import { Result, resultMap } from "../../result";

import { RequestsOverTime } from "../../timeCalculations/fetchTimeData";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getTotalRequestsOverTime(
  data: DataOverTimeRequest
): Promise<Result<RequestsOverTime[], string>> {
  const res = await getXOverTime<{
    count: number;
  }>(data, "count(*) as count");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.count),
    }))
  );
}
