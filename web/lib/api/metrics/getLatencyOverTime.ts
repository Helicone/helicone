import { Result, resultMap } from "@/packages/common/result";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getLatencyOverTime(
  data: DataOverTimeRequest,
): Promise<Result<LatencyOverTime[], string>> {
  // Filter out batch models from latency calculations
  const batchModelFilter: FilterNode = {
    request_response_rmt: {
      model: {
        "not-contains": "-batch",
      },
    },
  };

  const combinedFilter: FilterNode = {
    left: data.userFilter,
    operator: "and",
    right: batchModelFilter,
  };

  const res = await getXOverTime<{
    latency: number;
  }>(
    { ...data, userFilter: combinedFilter },
    "avg(request_response_rmt.latency) as latency"
  );
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      duration: Number(d.latency),
    })),
  );
}
export interface LatencyOverTime {
  duration: number;
  time: Date;
}
