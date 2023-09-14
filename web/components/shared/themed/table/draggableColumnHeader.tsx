import {
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/20/solid";
import {
  Column,
  ColumnOrderState,
  Header,
  SortDirection,
  Table,
  flexRender,
} from "@tanstack/react-table";
import { useRouter } from "next/router";
import { FC } from "react";
import { useDrag, useDrop } from "react-dnd";
import { clsx } from "../../clsx";

export default function DraggableColumnHeader<T>(props: {
  header: Header<T, unknown>;
  table: Table<T>;
  sortable:
    | {
        sortKey: string | null;
        sortDirection: SortDirection | null;
        isCustomProperty: boolean;
      }
    | undefined;
}) {
  const { header, table, sortable } = props;
  const { getState, setColumnOrder } = table;
  const { columnOrder } = getState();
  const { column } = header;
  const router = useRouter();

  const reorderColumn = (
    draggedColumnId: string,
    targetColumnId: string,
    columnOrder: string[]
  ): ColumnOrderState => {
    columnOrder.splice(
      columnOrder.indexOf(targetColumnId),
      0,
      columnOrder.splice(columnOrder.indexOf(draggedColumnId), 1)[0] as string
    );
    return [...columnOrder];
  };

  const [, dropRef] = useDrop({
    accept: "column",
    drop: (draggedColumn: Column<T>) => {
      const newColumnOrder = reorderColumn(
        draggedColumn.id,
        column.id,
        columnOrder
      );
      setColumnOrder(newColumnOrder);
    },
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => column,
    type: "column",
  });

  const meta = header.column.columnDef?.meta as any;
  const hasSortKey = meta?.sortKey !== undefined;

  return (
    <th
      {...{
        colSpan: header.colSpan,
        style: {
          width: header.getSize(),
          opacity: isDragging ? 0.5 : 1,
        },
      }}
      ref={dropRef}
      className="text-left py-2 font-semibold text-gray-900"
    >
      <div className="flex flex-row items-center gap-0.5">
        <button ref={dragRef} className="flex flex-row items-center">
          <EllipsisVerticalIcon className="h-3 w-3" />
          <EllipsisVerticalIcon className="h-3 w-3 -ml-2" />
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </button>

        {sortable && hasSortKey && (
          <span
            onClick={() => {
              if (meta && sortable) {
                const { sortKey, isCustomProperty, sortDirection } = sortable;

                if (sortKey === meta.sortKey) {
                  const direction = sortDirection === "asc" ? "desc" : "asc";
                  router.query.sortDirection = direction;
                } else {
                  router.query.sortDirection = "asc";
                }

                if (meta.isCustomProperty) {
                  router.query.isCustomProperty = "true";
                }
                router.query.sortKey = meta.sortKey;
                router.push(router);
              }
            }}
            className="ml-1 flex-none rounded bg-gray-100 text-gray-900 group-hover:bg-gray-200 hover:cursor-pointer"
          >
            {meta.sortKey === sortable.sortKey ? (
              sortable.sortDirection === "asc" ? (
                <ChevronUpIcon
                  className="h-4 w-4 border border-yellow-500 rounded-md"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDownIcon
                  className="h-4 w-4 border border-yellow-500 rounded-md"
                  aria-hidden="true"
                />
              )
            ) : (
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        )}
      </div>

      <button
        onClick={() => header.column.getToggleSortingHandler()}
        className={clsx(
          header.column.getCanSort() ? "cursor-pointer select-none" : "",
          "resizer pl-4 pr-2 mr-4 w-4"
        )}
        {...{
          onMouseDown: header.getResizeHandler(),
          onTouchStart: header.getResizeHandler(),
        }}
      >
        <div
          className={clsx(
            header.column.getIsResizing() ? "bg-blue-700" : "bg-gray-500",
            "h-full w-1"
          )}
        />
      </button>
    </th>
    // <th
    //   ref={dropRef}
    //   colSpan={header.colSpan}
    //   style={{ opacity: isDragging ? 0.5 : 1 }}
    // >
    //   <div ref={previewRef}>
    //     {header.isPlaceholder
    //       ? null
    //       : flexRender(header.column.columnDef.header, header.getContext())}
    //     <button ref={dragRef}>🟰</button>
    //   </div>
    // </th>
  );
}
