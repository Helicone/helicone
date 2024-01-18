import {
  BarsArrowDownIcon,
  BarsArrowUpIcon,
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
import { Fragment } from "react";
import { useDrag, useDrop } from "react-dnd";
import { clsx } from "../../clsx";
import { Menu, Transition } from "@headlessui/react";

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
      className="text-left py-2 font-semibold text-gray-900 dark:text-gray-100 relative"
    >
      <div className="flex flex-row items-center gap-0.5">
        <button
          ref={dragRef}
          className="flex flex-row items-center py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg"
        >
          <EllipsisVerticalIcon className="h-3 w-3 -ml-1" />
          <EllipsisVerticalIcon className="h-3 w-3 -ml-2" />
          <span className="text-gray-900 dark:text-gray-100">
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </span>
        </button>

        {sortable && hasSortKey && (
          <div className="text-right items-center">
            <Menu as="div" className="relative text-left pl-1">
              <div className="flex items-center">
                <Menu.Button className="hover:bg-gray-100 dark:hover:bg-gray-900  rounded-md p-1 -m-0.5">
                  {meta.sortKey === sortable.sortKey ? (
                    sortable.sortDirection === "asc" ? (
                      <BarsArrowUpIcon
                        className="h-4 w-4 text-sky-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <BarsArrowDownIcon
                        className="h-4 w-4 text-sky-500"
                        aria-hidden="true"
                      />
                    )
                  ) : (
                    <BarsArrowDownIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-24 origin-top-right divide-y divide-gray-100 dark:divide-gray-900 rounded-md bg-white dark:bg-black shadow-lg ring-1 ring-black dark:ring-gray-500 ring-opacity-5 focus:outline-none">
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active
                              ? "bg-sky-500 text-white dark:text-black"
                              : "text-gray-900 dark:text-gray-100"
                          } group flex w-full items-center justify-between rounded-md px-2 py-2 text-xs`}
                          onClick={() => {
                            if (meta && sortable) {
                              router.query.sortDirection = "asc";
                              router.query.sortKey = meta.sortKey;

                              router.push(router);
                            }
                          }}
                        >
                          <BarsArrowUpIcon
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          ASC
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active
                              ? "bg-sky-500 text-white dark:text-black"
                              : "text-gray-900 dark:text-gray-100"
                          } group flex w-full items-center justify-between rounded-md px-2 py-2 text-xs`}
                          onClick={() => {
                            if (meta && sortable) {
                              router.query.sortDirection = "desc";
                              router.query.sortKey = meta.sortKey;

                              router.push(router);
                            }
                          }}
                        >
                          <BarsArrowDownIcon className="h-4 w-4" />
                          DESC
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
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
            header.column.getIsResizing()
              ? "bg-blue-700 dark:bg-blue-300"
              : "bg-gray-500",
            "h-full w-1"
          )}
        />
      </button>
    </th>
  );
}
