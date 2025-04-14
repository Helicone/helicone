import { Result, resultMap } from "../../../packages/common/result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getLatencyOverTime(
  data: DataOverTimeRequest
): Promise<Result<LatencyOverTime[], string>> {
  const res = await getXOverTime<{
    latency: number;
  }>(data, "avg(request_response_rmt.latency) as latency");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      duration: Number(d.latency),
    }))
  );
}
export interface LatencyOverTime {
  duration: number;
  time: Date;
}
