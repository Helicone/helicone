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

export interface Column {
  key: string;
  label: string;
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
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const router = useRouter();

  const handleChangePage = (event: unknown, newPage: number) => {
    // setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    // setPage(0);
  };

  const hasPrevious = page > 1;
  const hasNext = to <= count!;

  return (
    <>
      <p className="text-sm text-gray-700 pb-2 pl-1">
        Showing <span className="font-medium">{from + 1}</span> to{" "}
        <span className="font-medium">{Math.min(to + 1, count as number)}</span>{" "}
        of <span className="font-medium">{count}</span> results
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
                    <p
                      className={clsx(
                        condensed ? "py-2" : "",
                        "whitespace-nowrap font-semibold text-black font-sans text-sm"
                      )}
                    >
                      {column.label}
                    </p>
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
