import moment from "moment";

import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuthClickHouse,
  buildFilterWithAuthClickHouseCacheHits,
  buildFilterWithAuthClickHouseRateLimits,
  clickhouseParam,
} from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../../packages/common/result";
import {
  isValidTimeFilter,
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { TimeIncrement } from "../../timeCalculations/fetchTimeData";
import { dbQueryClickhouse, printRunnableQuery } from "../db/dbExecute";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";
import { DEFAULT_UUID } from "@/packages/llm-mapper/types";

function convertDbIncrement(dbIncrement: TimeIncrement): string {
  return dbIncrement === "min" ? "MINUTE" : dbIncrement;
}

function buildFill(
  startDate: Date,
  endDate: Date,
  dbIncrement: TimeIncrement,
  timeZoneDifference: number,
  argsAcc: any[]
): {
  fill: string;
  argsAcc: any[];
} {
  const i = argsAcc.length;
  const startDateVal = buildDateTrunc(
    dbIncrement,
    timeZoneDifference,
    clickhouseParam(i, startDate)
  );
  const endDateVal = buildDateTrunc(
    dbIncrement,
    timeZoneDifference,
    clickhouseParam(i + 1, endDate)
  );

  const fill = `WITH FILL FROM ${startDateVal} to ${endDateVal} + 1 STEP INTERVAL 1 ${convertDbIncrement(
    dbIncrement
  )}`;
  return { fill, argsAcc: [...argsAcc, startDate, endDate] };
}

function buildDateTrunc(
  dbIncrement: TimeIncrement,
  timeZoneDifference: number,
  column: string
): string {
  return `DATE_TRUNC('${convertDbIncrement(dbIncrement)}', ${column} ${
    timeZoneDifference > 0
      ? `- INTERVAL '${Math.abs(timeZoneDifference)} minute'`
      : `+ INTERVAL '${timeZoneDifference} minute'`
  }, 'UTC')`;
}

export async function getXOverTime<T>(
  {
    timeFilter,
    userFilter,
    orgId,
    dbIncrement,
    timeZoneDifference,
  }: DataOverTimeRequest,
  countColumn: string,
  groupByColumns: string[] = [],
  printQuery = false
): Promise<
  Result<
    (T & {
      created_at_trunc: Date;
    })[],
    string
  >
> {
  const startDate = new Date(timeFilter.start);
  const endDate = new Date(timeFilter.end);
  const timeFilterNode: FilterNode = {
    left: {
      request_response_rmt: {
        request_created_at: {
          gte: startDate,
        },
      },
    },
    right: {
      request_response_rmt: {
        request_created_at: {
          lte: endDate,
        },
      },
    },
    operator: "and",
  };
  const filter: FilterNode = {
    left: timeFilterNode,
    right: userFilter,
    operator: "and",
  };

  if (!isValidTimeFilter(timeFilter)) {
    return { data: null, error: "Invalid time filter" };
  }
  if (!isValidTimeIncrement(dbIncrement)) {
    return { data: null, error: "Invalid time increment" };
  }
  if (!isValidTimeZoneDifference(timeZoneDifference)) {
    return { data: null, error: "Invalid time zone difference" };
  }
  const { filter: builtFilter, argsAcc: builtFilterArgsAcc } =
    await buildFilterWithAuthClickHouse({
      org_id: orgId,
      filter,
      argsAcc: [],
    });
  const { fill, argsAcc } = buildFill(
    startDate,
    endDate,
    dbIncrement,
    timeZoneDifference,
    builtFilterArgsAcc
  );
  const dateTrunc = buildDateTrunc(
    dbIncrement,
    timeZoneDifference,
    "request_created_at"
  );
  const query = `
  -- getXOverTime
SELECT
  ${dateTrunc} as created_at_trunc,
  ${groupByColumns.concat([countColumn]).join(", ")}
FROM request_response_rmt
WHERE (
  ${builtFilter}
)
GROUP BY ${groupByColumns.concat([dateTrunc]).join(", ")}
ORDER BY ${dateTrunc} ASC ${fill}
`;

  if (printQuery) {
    await printRunnableQuery(query, argsAcc);
  }

  type ResultType = T & {
    created_at_trunc: Date;
  };
  return resultMap(await dbQueryClickhouse<ResultType>(query, argsAcc), (d) =>
    d.map((r) => ({
      ...r,
      created_at_trunc: new Date(
        moment
          .utc(r.created_at_trunc, "YYYY-MM-DD HH:mm:ss")
          .toDate()
          .getTime() +
          timeZoneDifference * 60 * 1000
      ),
    }))
  );
}

// --OLD CACHE--: backwards compatibility, we read from both cache_hits
// and request_response_rmt.
export async function getXOverTimeCacheHitsDeprecated<
  T extends { count: number }
>(
  { timeFilter, orgId, dbIncrement, timeZoneDifference }: DataOverTimeRequest,
  countColumn: string,
  groupByColumns: string[] = [],
  printQuery = false
): Promise<
  Result<
    (T & {
      created_at_trunc: Date;
    })[],
    string
  >
> {
  const startDate = new Date(timeFilter.start);
  const endDate = new Date(timeFilter.end);
  const timeFilterNodeCache: FilterNode = {
    left: {
      cache_hits: {
        created_at: {
          gte: startDate,
        },
      },
    },
    right: {
      cache_hits: {
        created_at: {
          lte: endDate,
        },
      },
    },
    operator: "and",
  };

  if (!isValidTimeFilter(timeFilter)) {
    return { data: null, error: "Invalid time filter" };
  }
  if (!isValidTimeIncrement(dbIncrement)) {
    return { data: null, error: "Invalid time increment" };
  }
  if (!isValidTimeZoneDifference(timeZoneDifference)) {
    return { data: null, error: "Invalid time zone difference" };
  }

  const { filter: builtFilterCache, argsAcc: builtFilterArgsAccCache } =
    await buildFilterWithAuthClickHouseCacheHits({
      org_id: orgId,
      filter: timeFilterNodeCache,
      argsAcc: [],
    });

  const { fill: fillCache, argsAcc: argsAccCache } = buildFill(
    startDate,
    endDate,
    dbIncrement,
    timeZoneDifference,
    builtFilterArgsAccCache
  );

  const dateTruncCache = buildDateTrunc(
    dbIncrement,
    timeZoneDifference,
    "created_at"
  );

  const query = `
SELECT
  ${dateTruncCache} as created_at_trunc,
  ${groupByColumns.concat([countColumn]).join(", ")}
FROM cache_hits
WHERE (
  ${builtFilterCache}
)
GROUP BY ${groupByColumns.concat([dateTruncCache]).join(", ")}
ORDER BY ${dateTruncCache} ASC ${fillCache}
`;

  if (printQuery) {
    printRunnableQuery(query, argsAccCache);
  }

  type ResultType = T & {
    created_at_trunc: Date;
  };
  return resultMap(
    await dbQueryClickhouse<ResultType>(query, argsAccCache),
    (d) =>
      d.map((r) => ({
        ...r,
        created_at_trunc: new Date(
          moment
            .utc(r.created_at_trunc, "YYYY-MM-DD HH:mm:ss")
            .toDate()
            .getTime() +
            timeZoneDifference * 60 * 1000
        ),
      }))
  );
}

export async function getXOverTimeCacheHits<T extends { count: number }>(
  request: DataOverTimeRequest,
  countColumn: string,
  groupByColumns: string[] = [],
  printQuery = false
): Promise<
  Result<
    (T & {
      created_at_trunc: Date;
    })[],
    string
  >
> {
  const startDate = new Date(request.timeFilter.start);
  const endDate = new Date(request.timeFilter.end);
  const timeFilterNodeRmt: FilterNode = {
    left: {
      request_response_rmt: {
        request_created_at: {
          gte: startDate,
        },
      },
    },
    right: {
      request_response_rmt: {
        request_created_at: {
          lte: endDate,
        },
      },
    },
    operator: "and",
  };

  if (!isValidTimeFilter(request.timeFilter)) {
    return { data: null, error: "Invalid time filter" };
  }
  if (!isValidTimeIncrement(request.dbIncrement)) {
    return { data: null, error: "Invalid time increment" };
  }
  if (!isValidTimeZoneDifference(request.timeZoneDifference)) {
    return { data: null, error: "Invalid time zone difference" };
  }

  const { filter: builtFilterRmt, argsAcc: builtFilterArgsAccRmt } =
    await buildFilterWithAuthClickHouse({
      org_id: request.orgId,
      filter: timeFilterNodeRmt,
      argsAcc: [],
    });

  const { fill: fillRmt, argsAcc: argsAccRmt } = buildFill(
    startDate,
    endDate,
    request.dbIncrement,
    request.timeZoneDifference,
    builtFilterArgsAccRmt
  );

  const dateTruncRmt = buildDateTrunc(
    request.dbIncrement,
    request.timeZoneDifference,
    "request_created_at"
  );

  // deprecated cache hits
  const deprecatedResult = await getXOverTimeCacheHitsDeprecated<T>(
    request,
    countColumn,
    groupByColumns,
    printQuery
  );

  if (deprecatedResult.error) {
    return deprecatedResult;
  }

  const queryRmt = `
WITH rmt AS (
  SELECT
    ${dateTruncRmt} as created_at_trunc,
    ${groupByColumns.concat([countColumn]).join(", ")}
  FROM request_response_rmt
  WHERE (
    ${builtFilterRmt}
    AND cache_reference_id != '${DEFAULT_UUID}'
  )
  GROUP BY ${groupByColumns.concat([dateTruncRmt]).join(", ")}
  ORDER BY ${dateTruncRmt} ASC ${fillRmt}
)
SELECT * FROM rmt
`;

  if (printQuery) {
    printRunnableQuery(queryRmt, argsAccRmt);
  }

  type ResultType = T & {
    created_at_trunc: Date;
  };

  const rmtResult = resultMap(
    await dbQueryClickhouse<ResultType>(queryRmt, argsAccRmt),
    (d) =>
      d.map((r) => ({
        ...r,
        created_at_trunc: new Date(
          moment
            .utc(r.created_at_trunc, "YYYY-MM-DD HH:mm:ss")
            .toDate()
            .getTime() +
            request.timeZoneDifference * 60 * 1000
        ),
      }))
  );
  if (rmtResult.error || !rmtResult.data || !deprecatedResult.data) {
    return rmtResult;
  }

  // --OLD CACHE--: backwards compatibility, we read from both cache_hits
  // and request_response_rmt by mapping both
  const dateCountMap = new Map<string, number>();

  // counts from request_response_rmt
  rmtResult.data.forEach((r) => {
    const date = moment.utc(r.created_at_trunc).format("YYYY-MM-DD HH:mm:ss");
    dateCountMap.set(date, Number(r.count));
  });

  // counts from deprecated cache_hits
  deprecatedResult.data.forEach((r) => {
    const date = moment.utc(r.created_at_trunc).format("YYYY-MM-DD HH:mm:ss");
    const existingCount = dateCountMap.get(date) || 0;
    dateCountMap.set(date, existingCount + Number(r.count));
  });

  // convert back to array format
  const combinedData = Array.from(dateCountMap.entries()).map(
    ([date, count]) => ({
      created_at_trunc: new Date(
        moment.utc(date, "YYYY-MM-DD HH:mm:ss").toDate().getTime() +
          request.timeZoneDifference * 60 * 1000
      ),
      count,
    })
  ) as (T & { created_at_trunc: Date })[];

  // sort by date
  combinedData.sort(
    (a, b) => a.created_at_trunc.getTime() - b.created_at_trunc.getTime()
  );

  return {
    data: combinedData,
    error: null,
  };
}

export async function getXOverTimeRateLimit<T>(
  { timeFilter, orgId, dbIncrement, timeZoneDifference }: DataOverTimeRequest,
  countColumn: string,
  groupByColumns: string[] = [],
  printQuery = false
): Promise<
  Result<
    (T & {
      created_at_trunc: Date;
    })[],
    string
  >
> {
  const startDate = new Date(timeFilter.start);
  const endDate = new Date(timeFilter.end);
  const timeFilterNode: FilterNode = {
    left: {
      rate_limit_log: {
        created_at: {
          gte: startDate,
        },
      },
    },
    right: {
      rate_limit_log: {
        created_at: {
          lte: endDate,
        },
      },
    },
    operator: "and",
  };
  const filter: FilterNode = timeFilterNode;

  if (!isValidTimeFilter(timeFilter)) {
    return { data: null, error: "Invalid time filter" };
  }
  if (!isValidTimeIncrement(dbIncrement)) {
    return { data: null, error: "Invalid time increment" };
  }
  if (!isValidTimeZoneDifference(timeZoneDifference)) {
    return { data: null, error: "Invalid time zone difference" };
  }
  const { filter: builtFilter, argsAcc: builtFilterArgsAcc } =
    await buildFilterWithAuthClickHouseRateLimits({
      org_id: orgId,
      filter,
      argsAcc: [],
    });
  const { fill, argsAcc } = buildFill(
    startDate,
    endDate,
    dbIncrement,
    timeZoneDifference,
    builtFilterArgsAcc
  );
  const dateTrunc = buildDateTrunc(
    dbIncrement,
    timeZoneDifference,
    "created_at"
  );

  const query = `
SELECT
  ${dateTrunc} as created_at_trunc,
  ${groupByColumns.concat([countColumn]).join(", ")}
FROM rate_limit_log
WHERE (
  ${builtFilter}
)
GROUP BY ${groupByColumns.concat([dateTrunc]).join(", ")}
ORDER BY ${dateTrunc} ASC ${fill}
`;

  if (printQuery) {
    await printRunnableQuery(query, argsAcc);
  }

  type ResultType = T & {
    created_at_trunc: Date;
  };
  return resultMap(await dbQueryClickhouse<ResultType>(query, argsAcc), (d) =>
    d.map((r) => ({
      ...r,
      created_at_trunc: new Date(
        moment
          .utc(r.created_at_trunc, "YYYY-MM-DD HH:mm:ss")
          .toDate()
          .getTime() +
          timeZoneDifference * 60 * 1000
      ),
    }))
  );
}
