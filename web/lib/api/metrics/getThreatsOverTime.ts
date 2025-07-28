import { Result, resultMap } from "@/packages/common/result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getThreatsOverTime(
  data: DataOverTimeRequest,
): Promise<Result<ThreatsOverTime[], string>> {
  const res = await getXOverTime<{
    threats: number;
  }>(data, "countIf(request_response_rmt.threat = true) AS threats");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.threats),
    })),
  );
}
export interface ThreatsOverTime {
  count: number;
  time: Date;
}
