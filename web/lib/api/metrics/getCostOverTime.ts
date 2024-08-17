import { clickhousePriceCalc } from "../../../packages/cost";
import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";

import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export interface DateCountDBModel {
  time: Date;
  cost: number;
}

export async function getCostOverTime(
  data: DataOverTimeRequest
): Promise<Result<DateCountDBModel[], string>> {
  const res = await getXOverTime<{
    cost: number;
  }>(data, `${clickhousePriceCalc("request_response_rmt")} AS cost`);
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      cost: Number(d.cost),
    }))
  );
}
