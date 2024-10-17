import { ThreatsOverTime } from "../../../pages/api/metrics/threatsOverTime";
import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getThreatsOverTime(
  data: DataOverTimeRequest
): Promise<Result<ThreatsOverTime[], string>> {
  const res = await getXOverTime<{
    threats: number;
  }>(data, "countIf(request_response_rmt.threat = true) AS threats");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.threats),
    }))
  );
}
