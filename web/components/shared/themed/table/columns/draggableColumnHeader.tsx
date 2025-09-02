import { Menu, Transition } from "@headlessui/react";
import { BarsArrowDownIcon, BarsArrowUpIcon } from "@heroicons/react/20/solid";
import { Header, SortDirection, flexRender } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { clsx } from "../../../clsx";

export default function DraggableColumnHeader<T>(props: {
  header: Header<T, unknown>;
  sortable:
    | {
        sortKey: string | null;
        sortDirection: SortDirection | null;
        isCustomProperty: boolean;
      }
    | undefined;
  index: number;
  totalColumns: number;
  className?: string;
}) {
  const { header, sortable, index, totalColumns, className } = props;
  const router = useRouter();

  const meta = header.column.columnDef?.meta as any;
  const hasSortKey = meta?.sortKey !== undefined;

  return (
    <div
      {...{
        colSpan: header.colSpan,
      }}
      className={clsx(
        "relative px-2 text-left font-semibold text-gray-900 dark:text-gray-100",
        index === 0 && "pl-10",
        index === totalColumns - 1 && "pr-10",
        className,
      )}
    >
      <div className="flex flex-row items-center justify-between">
        <button className="flex flex-row items-center rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <span className="text-gray-900 dark:text-gray-100">
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </span>
        </button>

        {sortable && hasSortKey && (
          <div className="items-center text-right">
            <Menu as="div" className="relative pl-1 text-left">
              <div className="flex items-center">
                <Menu.Button className="-m-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900">
                  {meta.sortKey === sortable.sortKey ? (
                    sortable.sortDirection === "asc" ? (
                      <BarsArrowUpIcon
                        className="h-3 w-3 text-sky-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <BarsArrowDownIcon
                        className="h-3 w-3 text-sky-500"
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
                <Menu.Items className="absolute right-0 z-50 mt-2 w-24 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:divide-gray-900 dark:bg-black dark:ring-gray-500">
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
                            className="h-3 w-3"
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
          "resizer absolute right-0 top-0 h-full w-4 cursor-col-resize",
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
            "h-full w-1",
          )}
        />
      </button>
    </div>
  );
}
