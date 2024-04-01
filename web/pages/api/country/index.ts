// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { CountryData, getCountries } from "../../../services/lib/country";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

async function handler(
  options: HandlerWrapperOptions<Result<CountryData[], string>>
) {
  const {
    req,
    res,
    userData: { orgId },
  } = options;
  const { filter, offset, limit, timeFilter } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    timeFilter: {
      start: Date;
      end: Date;
    };
  };
  const { error, data } = await getCountries(
    orgId,
    filter,
    offset,
    limit,
    timeFilter
  );

  if (error !== null) {
    res.status(500).json({ error, data: null });
    return;
  }

  res.status(200).json({ error, data });
}

export default withAuth(handler);
