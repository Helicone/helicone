import moment from "moment";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuthClickHouse,
  clickhouseParam,
} from "../../../services/lib/filters/filters";

import { Result, resultMap } from "../../result";
import {
  isValidTimeFilter,
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { TimeIncrement } from "../../timeCalculations/fetchTimeData";
import { dbQueryClickhouse, printRunnableQuery } from "../db/dbExecute";

import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

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
  const fill = `WITH FILL FROM ${startDateVal} to ${endDateVal} + 1 STEP INTERVAL 1 ${dbIncrement}`;
  return { fill, argsAcc: [...argsAcc, startDate, endDate] };
}

function buildDateTrunc(
  dbIncrement: TimeIncrement,
  timeZoneDifference: number,
  column: string
): string {
  return `DATE_TRUNC('${dbIncrement}', ${column} ${
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
  printQuery = false,
  table: string = "response_copy_v3",
  created_at_column: string = "request_created_at"
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
      [table]: {
        [created_at_column]: {
          gte: startDate,
        },
      },
    },
    right: {
      [table]: {
        [created_at_column]: {
          lte: endDate,
        },
      },
    },
    operator: "and",
  };
  let filter: FilterNode = {
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
    await buildFilterWithAuthClickHouse(
      {
        org_id: orgId,
        filter,
        argsAcc: [],
      },
      table
    );
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
    created_at_column
  );
  const query = `
SELECT
  ${dateTrunc} as created_at_trunc,
  ${countColumn}
FROM ${table}
WHERE (
  ${builtFilter}
)
GROUP BY ${dateTrunc}
ORDER BY ${dateTrunc} ASC ${fill}
`;

  if (printQuery) {
    printRunnableQuery(query, argsAcc);
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
