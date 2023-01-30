import { TrashIcon } from "@heroicons/react/24/outline";
import { middleTruncString } from "../../lib/stringHelpers";
import { clsx } from "./clsx";

interface ThemedTableProps {
  columns: { name: string; key: string; hidden: boolean }[]; // hidden will hide this column on mobile
  rows?: any[];
  deleteHandler?: (row: any) => void;
}

const ThemedTable = (props: ThemedTableProps) => {
  const { columns, rows, deleteHandler } = props;

  return (
    <div className="mt-10 ring-1 ring-gray-300 rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            {columns.map((col, idx) => {
              if (idx === 0) {
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    {col.name}
                  </th>
                );
              } else {
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={clsx(
                      col.hidden ? "hidden" : "",
                      `px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell`
                    )}
                  >
                    {col.name}
                  </th>
                );
              }
            })}
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Select</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows &&
            rows.map((row, rowIdx) => (
              <tr key={row.id}>
                {columns.map((col, colIdx) => {
                  if (colIdx === 0) {
                    return (
                      <td
                        key={colIdx}
                        className={clsx(
                          rowIdx === 0 ? "" : "border-t border-transparent",
                          "relative py-4 pl-4 sm:pl-6 pr-3 text-sm"
                        )}
                      >
                        <div className="font-medium text-gray-900">
                          {middleTruncString(row[col.key], 12)}
                        </div>
                        {rowIdx !== 0 ? (
                          <div className="absolute right-0 left-6 -top-px h-px bg-gray-200" />
                        ) : null}
                      </td>
                    );
                  } else {
                    return (
                      <td
                        key={colIdx}
                        className={clsx(
                          rowIdx === 0 ? "" : "border-t border-gray-200",
                          col.hidden ? "hidden" : "",
                          "px-3 py-3.5 text-sm text-gray-500 lg:table-cell"
                        )}
                      >
                        {row[col.key]}
                      </td>
                    );
                  }
                })}
                {deleteHandler && (
                  <td
                    className={clsx(
                      rowIdx === 0 ? "" : "border-t border-transparent",
                      "relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-medium"
                    )}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md bg-red-600 p-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => deleteHandler(row)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    {rowIdx !== 0 ? (
                      <div className="absolute right-6 left-0 -top-px h-px bg-gray-200" />
                    ) : null}
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ThemedTable;
