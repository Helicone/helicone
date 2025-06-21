// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import {
  ModelMetric,
  modelMetrics,
  modelCount,
} from "../../../lib/api/models/models";
import { Result } from "@/packages/common/result";
import { FilterNode } from "@helicone-package/filters/filterDefs";

async function handler(
  options: HandlerWrapperOptions<Result<ModelMetric[] | number, string>>
) {
  const {
    req,
    res,
    userData: { orgId },
  } = options;
  const { filter, offset, limit, timeFilter, count } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    timeFilter: {
      start: Date;
      end: Date;
    };
    count?: boolean;
  };

  if (count) {
    const { error: countError, data: totalModelCount } = await modelCount(
      orgId,
      filter,
      timeFilter
    );
    if (countError !== null) {
      res.status(500).json({ error: countError, data: null });
      return;
    }
    res.status(200).json({ error: null, data: totalModelCount });
    return;
  }

  const { error: metricsError, data: metrics } = await modelMetrics(
    orgId,
    filter,
    offset,
    limit,
    timeFilter
  );
  if (metricsError !== null) {
    res.status(500).json({ error: metricsError, data: null });
    return;
  }

  res.status(200).json({ error: null, data: metrics });
}

export default withAuth(handler);
