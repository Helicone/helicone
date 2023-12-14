import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export interface FeedbackOverTime {
  time: Date;
  positiveCount: number;
  negativeCount: number;
}

/**
 * Retrieves feedback over time based on the provided data.
 * @param data The data for the request.
 * @returns A promise that resolves to a Result object containing an array of FeedbackOverTime objects or an error message.
 */
export async function getFeedbackOverTime(
  data: DataOverTimeRequest
): Promise<Result<FeedbackOverTime[], string>> {
  const res = await getXOverTime<{
    positiveFeedback: number;
    negativeFeedback: number;
  }>(
    data,
    "SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as positiveFeedback, SUM(CASE WHEN rating = 0 THEN 1 ELSE 0 END) as negativeFeedback"
  );

  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      positiveCount: Number(d.positiveFeedback),
      negativeCount: Number(d.negativeFeedback),
    }))
  );
}
