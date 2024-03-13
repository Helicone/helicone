// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import quantilesCalc, {
  Quantiles,
} from "../../../lib/api/metrics/quantilesCalc";
import { Result } from "../../../lib/result";
import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";

async function handler(
  options: HandlerWrapperOptions<Result<Quantiles[], string>>
) {
  const {
    req,
    res,
    userData: { orgId },
  } = options;
  const { timeFilter, dbIncrement, timeZoneDifference, metric } = req.body
    .data as {
    timeFilter: {
      start: string;
      end: string;
    };
    dbIncrement: TimeIncrement;
    timeZoneDifference: number;
    metric: string;
  };
  const { error: quantilesError, data: quantiles } = await quantilesCalc(
    {
      timeFilter,
      userFilter: "all",
      orgId: orgId,
      dbIncrement: dbIncrement ?? "hour",
      timeZoneDifference,
    },
    metric
  );

  if (quantilesError !== null) {
    res.status(500).json({ error: quantilesError, data: null });
    return;
  }

  res.status(200).json({ error: null, data: quantiles });
}

export default withAuth(handler);
