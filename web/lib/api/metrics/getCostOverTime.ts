import { Result, resultMap } from "@/packages/common/result";
import { getXOverTime } from "./getXOverTime";

import { DataOverTimeRequest } from "./timeDataHandlerWrapper";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";

export interface DateCountDBModel {
  time: Date;
  cost: number;
}

export async function getCostOverTime(
  data: DataOverTimeRequest,
): Promise<Result<DateCountDBModel[], string>> {
  const res = await getXOverTime<{
    cost: number;
  }>(data, `sum(cost) / ${COST_PRECISION_MULTIPLIER} AS cost`);
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      cost: Number(d.cost),
    })),
  );
}
