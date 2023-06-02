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
    resData.map((d) => {
      const new_time = new Date(new Date(d.created_at_trunc).getTime());
      console.log("new_time", new_time);
      return {
        time: new_time,
        count: Number(d.count),
      };
    })
  );
}
