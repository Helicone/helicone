import moment from "moment";

import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuthClickHouse,
  buildFilterWithAuthClickHouseRateLimits,
  buildFilterWithAuthClickHouseCacheMetrics,
  clickhouseParam,
} from "../../../services/lib/filters/filters";
import { Result, resultMap } from "@/packages/common/result";
import {
  isValidTimeFilter,
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { TimeIncrement } from "../../timeCalculations/fetchTimeData";
import { dbQueryClickhouse, printRunnableQuery } from "../db/dbExecute";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";

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

  const timeFilterNode: FilterNode = {
    left: {
      cache_metrics: {
        date: {
          gte: startDate,
        },
      },
    },
    right: {
      cache_metrics: {
        date: {
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

  const { filter: builtFilter, argsAcc: builtFilterArgsAcc } =
    await buildFilterWithAuthClickHouseCacheMetrics({
      org_id: request.orgId,
      filter: timeFilterNode,
      argsAcc: [],
    });

  let dateSelect = "date";
  let dateGroupBy = "date";
  let fillClause = "";
  
  if (request.dbIncrement === "day") {
    const startDateStr = clickhouseParam(builtFilterArgsAcc.length, startDate);
    const endDateStr = clickhouseParam(builtFilterArgsAcc.length + 1, endDate);
    fillClause = `WITH FILL FROM toDate(${startDateStr}) TO toDate(${endDateStr}) + 1 STEP INTERVAL 1 DAY`;
    builtFilterArgsAcc.push(startDate, endDate);
  } else if (request.dbIncrement === "hour" || request.dbIncrement === "min") {
    const dateTrunc = buildDateTrunc(
      request.dbIncrement,
      request.timeZoneDifference,
      "toDateTime(date)"
    );
    dateSelect = `${dateTrunc}`;
    dateGroupBy = dateSelect;
    const { fill, argsAcc } = buildFill(
      startDate,
      endDate,
      request.dbIncrement,
      request.timeZoneDifference,
      builtFilterArgsAcc
    );
    fillClause = fill;
    builtFilterArgsAcc.push(...argsAcc.slice(builtFilterArgsAcc.length));
  }

  const query = `
SELECT
  ${dateSelect} as created_at_trunc,
  ${groupByColumns.concat([countColumn]).join(", ")}
FROM cache_metrics
WHERE (
  ${builtFilter}
)
GROUP BY ${groupByColumns.concat([dateGroupBy]).join(", ")}
ORDER BY ${dateSelect} ASC ${fillClause}
`;
printRunnableQuery(query, builtFilterArgsAcc);

  if (printQuery) {
    printRunnableQuery(query, builtFilterArgsAcc);
  }

  type ResultType = T & {
    created_at_trunc: Date;
  };

  return resultMap(await dbQueryClickhouse<ResultType>(query, builtFilterArgsAcc), (d) =>
    d.map((r) => ({
      ...r,
      created_at_trunc: new Date(r.created_at_trunc),
    }))
  );
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
