import { Result, resultMap } from "../../result";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";
import { getXOverTime } from "./getXOverTime";

import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export interface DateCountDBModel {
  time: Date;
  cost: number;
}

/**
 * Retrieves the cost over time based on the provided data.
 * @param data The data for the request.
 * @returns A promise that resolves to an array of DateCountDBModel objects representing the cost over time, or a string error message.
 */
export async function getCostOverTime(
  data: DataOverTimeRequest
): Promise<Result<DateCountDBModel[], string>> {
  const res = await getXOverTime<{
    cost: number;
  }>(data, `${CLICKHOUSE_PRICE_CALC("response_copy_v3")} AS cost`);
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      cost: Number(d.cost),
    }))
  );
}
