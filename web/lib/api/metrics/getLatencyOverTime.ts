import { LatencyOverTime } from "../../../pages/api/metrics/latencyOverTime";
import { Result, resultMap } from "../../shared/result";

import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getLatencyOverTime(
  data: DataOverTimeRequest
): Promise<Result<LatencyOverTime[], string>> {
  const res = await getXOverTime<{
    latency: number;
  }>(data, "avg(response_copy_v3.latency) as latency");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      duration: Number(d.latency),
    }))
  );
}
