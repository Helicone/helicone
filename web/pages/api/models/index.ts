// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { ModelMetric, modelMetrics } from "../../../lib/api/models/models";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

async function handler(
  options: HandlerWrapperOptions<Result<ModelMetric[], string>>
) {
  const {
    req,
    res,
    userData: { orgId },
  } = options;
  const { filter, offset, limit } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
  };
  const { error: metricsError, data: metrics } = await modelMetrics(
    orgId,
    filter,
    offset,
    limit
  );
  if (metricsError !== null) {
    res.status(500).json({ error: metricsError, data: null });
    return;
  }

  res.status(200).json({ error: null, data: metrics });
}

export default withAuth(handler);
