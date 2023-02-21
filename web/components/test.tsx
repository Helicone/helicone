import * as React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { clsx } from "./shared/clsx";
import { useRouter } from "next/router";
import { ArrowsUpDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";

export interface Column {
  key: string;
  label: string;
  sortBy?: string;
  minWidth?: number;
  align?: "center" | "inherit" | "left" | "right" | "justify";
  format?: (value: any) => string;
}

interface ThemedTableProps {
  columns: readonly Column[];
  rows: readonly any[];
  page: number;
  from: number;
  to: number;
  count: number | null;
  onSelectHandler?: (row: any, idx: number) => void;
  condensed?: boolean;
}

export default function StickyHeadTable(props: ThemedTableProps) {
  const {
    columns,
    rows,
    page = 0,
    from,
    to,
    count,
    condensed = false,
    onSelectHandler,
  } = props;
  const router = useRouter();

  const hasPrevious = page > 1;
  const hasNext = to <= count!;

  return (
    <>
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
        <TableContainer sx={{ maxHeight: "70vh", paddingX: 1 }}>
          <Table
            stickyHeader
            aria-label="sticky table"
            size={condensed ? "small" : "medium"}
          >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.sortBy ? (
                      <button
                        onClick={() => {
                          if (
                            !router.query.sort ||
                            router.query.sort.includes("desc")
                          ) {
                            router.replace({
                              query: {
                                ...router.query,
                                sort: `${column.key}_asc`,
                              },
                            });
                            return;
                          }
                          router.replace({
                            query: {
                              ...router.query,
                              sort: `${column.key}_desc`,
                            },
                          });
                        }}
                        className={clsx(
                          condensed ? "py-2" : "",
                          "whitespace-nowrap font-semibold text-gray-700 font-sans text-sm flex flex-row items-center hover:text-black hover:scale-105 transition ease-in-out delay-150 duration-300"
                        )}
                      >
                        {column.label}
                        {router.query.sort?.includes("asc") ? (
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
                return (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={row.code}
                    onClick={() => onSelectHandler && onSelectHandler(row, idx)}
                    className="hover:cursor-pointer"
                  >
                    {columns.map((column, idx) => {
                      const value = row[column.key];
                      return (
                        <TableCell
                          key={column.key}
                          align={column.align || "left"}
                        >
                          <p
                            className={clsx(
                              condensed ? "py-1" : "",
                              idx === 0
                                ? " text-black font-medium"
                                : "text-gray-500 font-normal",
                              "font-sans text-sm"
                            )}
                          >
                            {column.format ? column.format(value) : value}
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
    </>
  );
}
