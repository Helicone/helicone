import { LatencyOverTime } from "../../../pages/api/metrics/latencyOverTime";
import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

/**
 * Retrieves the latency over time based on the provided data.
 * @param data The data over time request.
 * @returns A promise that resolves to a Result object containing an array of LatencyOverTime objects or an error message.
 */
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
