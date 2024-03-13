import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export interface Quantiles {
  time: Date;
  value: number;
}

export default async function quantilesCalc(
  data: DataOverTimeRequest,
  property: string
): Promise<Result<Quantiles[], string>> {
  const query = `quantile(0.25)(${property}) as P25`;

  const res = await getXOverTime<{
    P25: number;
  }>(data, query);
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      value: Number(d.P25),
    }))
  );
}
