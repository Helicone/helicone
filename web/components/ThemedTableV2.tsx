import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { clsx } from "./shared/clsx";
import { useRouter } from "next/router";
import { ArrowUpIcon } from "@heroicons/react/24/outline";

import {
  SortDirection,
  SortLeafRequest,
} from "../services/lib/sorts/requests/sorts";
import { ColumnType } from "../services/lib/filters/frontendFilterDefs";
import { RequestWrapper } from "./templates/requests/useRequestsPage";
import { SortLeafUsers } from "../services/lib/sorts/users/sorts";
import { UserMetric } from "../lib/api/users/users";

export interface Column {
  key: keyof RequestWrapper | keyof UserMetric;
  label: string;
  active: boolean;
  type?: ColumnType;
  filter?: boolean;
  sortBy?: SortDirection;
  columnOrigin?: "property" | "value" | "feedback";
  minWidth?: number;
  align?: "center" | "inherit" | "left" | "right" | "justify";
  toSortLeaf?: (direction: SortDirection) => SortLeafRequest | SortLeafUsers;
  format?: (value: any, mode: "Condensed" | "Expanded") => string;
}

interface ThemedTableV2Props {
  columns: readonly Column[];
  rows: readonly any[];
  page: number;
  from: number;
  to: number;
  count: number | null;
  onPageChangeHandler?: (page: number) => void;
  onPageSizeChangeHandler?: (pageSize: number) => void;
  onSelectHandler?: (row: any, idx: number) => void;
  onSortHandler?: (key: Column) => void;
  condensed?: boolean;
  isPreview?: boolean;
}

export default function ThemedTableV2(props: ThemedTableV2Props) {
  const {
    columns,
    rows,
    page = 0,
    from,
    to,
    count,
    condensed = false,
    onSelectHandler,
    onPageChangeHandler,
    onSortHandler,
    onPageSizeChangeHandler,
    isPreview,
  } = props;
  const router = useRouter();

  const hasPrevious = page > 1;
  const hasNext = to <= count!;

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">
        Showing <span className="font-medium">{from + 1}</span> to{" "}
        <span className="font-medium">{Math.min(to, count as number)}</span> of{" "}
        <span className="font-medium">{count}</span> results
      </p>
      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          borderWidth: "1px",
          borderRadius: "0.5rem",
          boxShadow:
            "0 0 0 0.5px rgba(0, 0, 0, 0.05), 0 0.5px 1px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <TableContainer sx={{ paddingX: 1 }}>
          <Table
            stickyHeader
            aria-label="sticky table"
            size={condensed ? "small" : "medium"}
            style={isPreview === false ? {} : { tableLayout: "fixed" }}
          >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.label}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.sortBy !== undefined ? (
                      <button
                        onClick={() => onSortHandler && onSortHandler(column)}
                        className={clsx(
                          condensed ? "py-2" : "",
                          "whitespace-nowrap font-semibold text-gray-700 font-sans text-sm flex flex-row items-center hover:text-black hover:scale-105 transition ease-in-out delay-150 duration-300"
                        )}
                      >
                        {column.label}
                        {column.sortBy === "asc" ? (
                          <ArrowUpIcon className="h-3 w-3 ml-1 transition ease-in-out duration-300" />
                        ) : (
                          <ArrowUpIcon className="h-3 w-3 ml-1 transform rotate-180 transition ease-in-out duration-300" />
                        )}
                      </button>
                    ) : (
                      <p
                        className={clsx(
                          condensed ? "py-2" : "",
                          "whitespace-nowrap font-semibold text-gray-700 font-sans text-sm"
                        )}
                      >
                        {column.label}
                      </p>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => {
                const hasError = row.error;
                return (
                  <TableRow
                    role="checkbox"
                    tabIndex={-1}
                    key={`row-${idx}`}
                    onClick={() => onSelectHandler && onSelectHandler(row, idx)}
                    className={clsx(
                      hasError
                        ? "bg-red-100 hover:bg-red-200"
                        : "hover:bg-gray-100",
                      "hover:cursor-pointer"
                    )}
                  >
                    {columns.map((column, idx) => {
                      const value = row[column.key];
                      return (
                        <TableCell
                          key={`cell-${column.key}`}
                          align={column.align || "left"}
                          sx={{ verticalAlign: "top", whiteSpace: "pre-wrap" }}
                        >
                          <p
                            className={clsx(
                              condensed ? "py-1" : "",
                              idx === 0
                                ? "text-black"
                                : "text-black font-normal",
                              "font-sans text-sm"
                            )}
                          >
                            {column.format
                              ? column.format(value, "Condensed")
                              : value}
                          </p>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <div
          className="flex items-center justify-between bg-white py-2 px-4"
          aria-label="Pagination"
        >
          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              Page Size:
            </label>
            <select
              id="location"
              name="location"
              className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-6 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              defaultValue={router.query.page_size}
              onChange={(e) => {
                router.query.page_size = e.target.value;
                router.push(router);
                onPageSizeChangeHandler &&
                  onPageSizeChangeHandler(parseInt(e.target.value, 10));
              }}
            >
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
          <div className="flex flex-1 justify-end">
            <button
              onClick={() => {
                router.query.page = (page - 1).toString();
                router.push(router);
                onPageChangeHandler && onPageChangeHandler(page - 1);
              }}
              disabled={!hasPrevious}
              className={clsx(
                !hasPrevious
                  ? "bg-gray-100 hover:cursor-not-allowed"
                  : "hover:bg-gray-50",
                "relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              )}
            >
              Previous
            </button>
            <button
              onClick={() => {
                router.query.page = (page + 1).toString();
                router.push(router);
                onPageChangeHandler && onPageChangeHandler(page + 1);
              }}
              disabled={!hasNext}
              className={clsx(
                !hasNext
                  ? "bg-gray-100 hover:cursor-not-allowed"
                  : "hover:bg-gray-50",
                "relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              )}
            >
              Next
            </button>
          </div>
        </div>
      </Paper>
    </div>
  );
}
