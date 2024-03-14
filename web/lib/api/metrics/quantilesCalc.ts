import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export interface Quantiles {
  time: Date;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export default async function quantilesCalc(
  data: DataOverTimeRequest,
  metric: string
): Promise<Result<Quantiles[], string>> {
  let query;

  switch (metric) {
    case "total_tokens":
      query = `quantile(0.75)(completion_tokens + prompt_tokens) as P75,
      quantile(0.90)(completion_tokens + prompt_tokens) as P90,
      quantile(0.95)(completion_tokens + prompt_tokens) as P95,
      quantile(0.99)(completion_tokens + prompt_tokens) as P99`;
      break;
    default:
      query = `quantile(0.75)(${metric}) as P75,
      quantile(0.90)(${metric}) as P90,
      quantile(0.95)(${metric}) as P95,
      quantile(0.99)(${metric}) as P99`;
  }

  const res = await getXOverTime<{
    P75: number;
    P90: number;
    P95: number;
    P99: number;
  }>(data, query);
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      p75: Number(d.P75),
      p90: Number(d.P90),
      p95: Number(d.P95),
      p99: Number(d.P99),
    }))
  );
}
