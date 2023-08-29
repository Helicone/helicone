import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export interface FeedbackOverTime {
  time: Date;
  count: number;
}

export async function getFeedbackOverTime(
  data: DataOverTimeRequest
): Promise<Result<FeedbackOverTime[], string>> {
  const res = await getXOverTime<{
    feedback: number;
  }>(
    data,
    "count(is_thumbs_up) as feedback",
    undefined,
    "feedback",
    "response_created_at"
  );

  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.feedback),
    }))
  );
}
