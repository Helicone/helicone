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

/**
 * Builds the fill string and updates the arguments accumulator for a given date range.
 * @param startDate The start date of the range.
 * @param endDate The end date of the range.
 * @param dbIncrement The time increment for the database.
 * @param timeZoneDifference The time zone difference.
 * @param argsAcc The arguments accumulator.
 * @returns An object containing the fill string and updated arguments accumulator.
 */
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

/**
 * Builds a date truncation expression for a given database increment, time zone difference, and column.
 * @param dbIncrement The database increment to truncate the date to.
 * @param timeZoneDifference The time zone difference in minutes.
 * @param column The column to truncate the date from.
 * @returns The date truncation expression.
 */
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

/**
 * Retrieves data over time for a given set of filters.
 *
 * @param timeFilter - The time filter specifying the start and end dates.
 * @param userFilter - The filter for user-specific data.
 * @param orgId - The organization ID.
 * @param dbIncrement - The time increment for the database query.
 * @param timeZoneDifference - The time zone difference in minutes.
 * @param countColumn - The column to count.
 * @param groupByColumns - The columns to group by.
 * @param printQuery - Whether to print the query.
 * @returns A promise that resolves to the result of the query.
 */
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
      response_copy_v3: {
        request_created_at: {
          gte: startDate,
        },
      },
    },
    right: {
      response_copy_v3: {
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
SELECT
  ${dateTrunc} as created_at_trunc,
  ${groupByColumns.concat([countColumn]).join(", ")}
FROM response_copy_v3
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
