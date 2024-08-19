import { TimeToFirstToken } from "../../../pages/api/metrics/timeToFirstToken";
import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getTimeToFirstToken(
  data: DataOverTimeRequest
): Promise<Result<TimeToFirstToken[], string>> {
  const res = await getXOverTime<{
    ttft: number;
  }>(data, "avg(request_response_rmt.time_to_first_token) AS ttft");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      ttft: Number(d.ttft),
    }))
  );
}
