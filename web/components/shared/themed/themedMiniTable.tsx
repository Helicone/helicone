import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { middleTruncString } from "../../../lib/stringHelpers";
import { clsx } from "../clsx";

type Row<T> = {
  [key in keyof T]: {
    data: string;
  };
};

interface ThemedMiniTableProps<T> {
  columns: { name: string; key: keyof Row<T>; hidden: boolean }[];
  rows: Row<T>[];

  className?: {
    header?: string;
    tr?: string;
    td?: string;
  };
  onRowClick?: (row: Row<T>, idx: number) => void;
  header: string;
  isLoading: boolean;
}

export function ThemedMiniTable<T>(props: ThemedMiniTableProps<T>) {
  const { columns, rows, className } = props;

  return (
    <div
      className={clsx(
        "ring-gray-300 rounded-lg bg-white",
        props.isLoading ? "animate-pulse" : ""
      )}
    >
      {props.header && (
        <h1
          className={clsx(
            "text-2xl font-semibold text-center my-2 bg-white w-full"
          )}
        >
          {props.header}
        </h1>
      )}
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={`header-${idx}`}
                className={clsx(col.hidden ? "hidden" : "", className?.header)}
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={`row-${rowIdx}`}
              className={clsx("w-full", className?.tr)}
              onClick={() => props.onRowClick?.(row, rowIdx)}
            >
              {columns.map((col, colIdx) => {
                return (
                  <td
                    key={`${String(col.key)}-${colIdx}-${rowIdx}`}
                    className={clsx(className?.td)}
                  >
                    {row[col.key].data ?? "df/a"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
