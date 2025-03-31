import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clsx } from "../clsx";
import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

type ColumnConfig<T> = {
  key: keyof T | undefined;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
};

interface SimpleTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  emptyMessage?: string;
  onSelect?: (item: T) => void;
  className?: string;
  defaultSortKey?: keyof T;
  defaultSortDirection?: "asc" | "desc";
  onSort?: (key: keyof T | undefined, direction: "asc" | "desc") => void;
  currentSortKey?: keyof T | string;
  currentSortDirection?: "asc" | "desc";
}

export function SimpleTable<T>(props: SimpleTableProps<T>) {
  const {
    data,
    columns,
    emptyMessage = "No data available",
    onSelect,
    className,
    defaultSortKey,
    defaultSortDirection = "desc",
    onSort,
    currentSortKey,
    currentSortDirection,
  } = props;

  const [internalSortConfig, setInternalSortConfig] = useState<{
    key: keyof T | undefined;
    direction: "asc" | "desc";
  }>({
    key: defaultSortKey,
    direction: defaultSortDirection,
  });

  const sortConfig = onSort
    ? {
        key: currentSortKey as keyof T | undefined,
        direction: currentSortDirection || "desc",
      }
    : internalSortConfig;

  const sortedData = onSort
    ? data
    : [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        const compareResult = aValue < bValue ? -1 : 1;
        return sortConfig.direction === "asc" ? compareResult : -compareResult;
      });

  const handleSort = (key: keyof T | undefined) => {
    if (!key || key === undefined) return;

    const newDirection =
      sortConfig.key === key && sortConfig.direction === "desc"
        ? "asc"
        : "desc";

    if (onSort) {
      onSort(key, newDirection);
    } else {
      setInternalSortConfig({
        key,
        direction: newDirection,
      });
    }
  };

  return (
    <div
      className={clsx(
        "h-full overflow-x-auto bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700",
        className
      )}
    >
      <div className="bg-slate-50 dark:bg-black rounded-sm h-full">
        <Table className="h-full bg-white dark:bg-black">
          <TableHeader>
            <TableRow className="sticky top-0 bg-slate-50 dark:bg-slate-900 shadow-sm">
              {columns.map((column, index) => (
                <TableHead
                  key={String(column.key || index)}
                  className={clsx(
                    "relative text-[12px] font-semibold text-slate-900 dark:text-slate-100",
                    index === 0 && "pl-10",
                    column.sortable &&
                      "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable &&
                      sortConfig.key === column.key &&
                      (sortConfig.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      ))}
                  </div>
                  {index < columns.length - 1 && (
                    <div className="absolute top-0 right-0 h-full w-px bg-slate-300 dark:bg-slate-700" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-300 dark:bg-slate-700" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="text-[13px]">
            {sortedData.map((item, index) => (
              <TableRow
                key={`row-${index}`}
                className={clsx(
                  "hover:bg-sky-50 dark:hover:bg-slate-700/50",
                  onSelect && "hover:cursor-pointer"
                )}
                onClick={() => onSelect && onSelect(item)}
              >
                {columns.map((column, subIndex) => (
                  <TableCell
                    key={String(column.key || subIndex + column.header)}
                    className={clsx(
                      "py-3 border-t border-slate-300 dark:border-slate-700 px-2 text-slate-700 dark:text-slate-300",
                      subIndex === 0 && "pl-10",
                      subIndex === columns.length - 1 &&
                        "pr-10 border-r border-slate-300 dark:border-slate-700"
                    )}
                  >
                    {column.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {sortedData.length === 0 && (
        <div className="bg-white dark:bg-black h-48 w-full border-slate-300 dark:border-slate-700 py-2 px-4 flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
