import { Result, resultMap } from "@/packages/common/result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export interface FeedbackOverTime {
  time: Date;
  positiveCount: number;
  negativeCount: number;
}

export async function getFeedbackOverTime(
  data: DataOverTimeRequest,
): Promise<Result<FeedbackOverTime[], string>> {
  const res = await getXOverTime<{
    positiveFeedback: number;
    negativeFeedback: number;
  }>(
    data,
    "SUM(CASE WHEN has(scores, 'helicone-score-feedback') AND scores['helicone-score-feedback'] = 1 THEN 1 ELSE 0 END) as positiveFeedback, SUM(CASE WHEN has(scores, 'helicone-score-feedback') AND scores['helicone-score-feedback'] = 0 THEN 1 ELSE 0 END) as negativeFeedback",
  );

  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      positiveCount: Number(d.positiveFeedback),
      negativeCount: Number(d.negativeFeedback),
    })),
  );
}
