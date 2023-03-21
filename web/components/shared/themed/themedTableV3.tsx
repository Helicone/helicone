import * as React from "react";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { clsx } from "../clsx";
import { RequestWrapper } from "../../templates/requests/useRequestsPage";
import { getUSDate } from "../utils/utils";
import { truncString } from "../../../lib/stringHelpers";
import { useRouter } from "next/router";

interface ThemedTableV3Props {
  data: RequestWrapper[];
  columns: any[];
  page: number;
  from: number;
  to: number;
  count: number | null;
  onPageChangeHandler?: (page: number) => void;
  onPageSizeChangeHandler?: (pageSize: number) => void;
  onSelectHandler?: (row: any, idx: number) => void;
}

const ThemedTableV3 = (props: ThemedTableV3Props) => {
  const {
    data,
    columns,
    from,
    to,
    count,
    page,
    onPageChangeHandler,
    onPageSizeChangeHandler,
    onSelectHandler,
  } = props;

  const router = useRouter();
  const hasPrevious = page > 1;
  const hasNext = to <= count!;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">
        Showing <span className="font-medium">{from + 1}</span> to{" "}
        <span className="font-medium">{Math.min(to, count as number)}</span> of{" "}
        <span className="font-medium">{count}</span> results
      </p>
      <div className="overflow-x-auto font-sans">
        <table
          {...{
            style: {
              width: table.getCenterTotalSize(),
            },
          }}
          className="inline-block w-full bg-white border border-gray-200 rounded-lg shadow-sm p-2"
        >
          <thead className="text-left text-sm font-semibold text-gray-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="py-2.5 px-4 text-left text-sm font-semibold text-gray-900"
                    key={header.id}
                    {...{
                      colSpan: header.colSpan,
                      style: {
                        width: header.getSize(),
                      },
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    <div
                      className={clsx(
                        header.column.getIsResizing() ? "isResizing" : "",
                        "resizer"
                      )}
                      {...{
                        onMouseDown: header.getResizeHandler(),
                        onTouchStart: header.getResizeHandler(),
                      }}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => {
              const hasError = row.original.error;
              return (
                <tr
                  key={row.id}
                  className={clsx(
                    hasError
                      ? "bg-red-100 hover:bg-red-200"
                      : "hover:bg-gray-100",
                    "border-t border-gray-300",
                    "hover:cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell, idx) => (
                    <td
                      key={cell.id}
                      className={clsx(
                        idx === 0 ? "font-medium text-gray-900" : "font-normal",
                        "px-4 py-2.5 text-sm text-gray-700 "
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        className="flex items-center justify-betweenpy-2 px-4"
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
    </div>
  );
};

export default ThemedTableV3;
