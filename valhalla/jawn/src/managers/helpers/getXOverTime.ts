import { resultMap } from "../../lib/shared/result";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import {
  buildFilterWithAuthClickHouse,
  clickhouseParam,
} from "../../lib/shared/filters/filters";
import { Result } from "../../lib/shared/result";
import {
  isValidTimeFilter,
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "./timeHelpers";
import moment from "moment";
import { RequestClickhouseFilterNode } from "../../controllers/public/requestController";

export type TimeIncrement = "min" | "hour" | "day" | "week" | "month" | "year";

export interface DataOverTimeRequest {
  timeFilter: {
    start: string;
    end: string;
  };
  userFilter: RequestClickhouseFilterNode;
  dbIncrement: TimeIncrement;
  timeZoneDifference: number;
}

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

    dbIncrement,
    timeZoneDifference,
  }: DataOverTimeRequest,
  {
    orgId,
    countColumn,
    groupByColumns = [],
  }: {
    orgId: string;
    countColumn: string;
    groupByColumns?: string[];
  }
): Promise<
  Result<
    (T & {
      created_at_trunc: string;
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
      ).toISOString(),
    }))
  );
}
