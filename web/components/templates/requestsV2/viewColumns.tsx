import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  AdjustmentsHorizontalIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import { clsx } from "../../shared/clsx";

interface ViewColumnsProps<T> {
  columns: Column<T, unknown>[];
  onSelectAll: (value?: boolean | undefined) => void;
  visibleColumns: number;
}

export default function ViewColumns<T>(props: ViewColumnsProps<T>) {
  const { columns, onSelectAll, visibleColumns } = props;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
            View {`( ${visibleColumns} / ${columns.length} )`}
          </p>
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
        <Menu.Items className="absolute z-10 right-0 mt-2 w-[200px] origin-top-right rounded-lg bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="grid grid-cols-2 divide-x divide-gray-300 dark:divide-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg border-b border-gray-300 dark:border-gray-700">
            <button
              onClick={() => onSelectAll(false)}
              className="text-xs flex items-center justify-center gap-x-2.5 p-2.5 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-t-lg"
            >
              Deselect All
            </button>
            <button
              onClick={() => onSelectAll(true)}
              className="text-xs flex items-center justify-center gap-x-2.5 p-2.5 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              Select All
            </button>
          </div>
          <div className="flex flex-col overflow-auto max-h-[40vh] py-0.5">
            {columns.map((column, idx) => {
              const header = column.columnDef.header as string;

              return (
                <div key={idx} className="flex flex-row py-0.5">
                  <label
                    key={idx}
                    className="relative mx-1 px-3 py-2 rounded-md select-none font-medium text-gray-900 w-full items-center flex hover:bg-sky-100 dark:hover:bg-sky-900 hover:cursor-pointer"
                  >
                    {column.getIsVisible() ? (
                      <CheckIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className="text-sm text-gray-700 hover:text-sky-900 dark:text-gray-300 dark:hover:text-sky-100 pl-2">
                      {header}
                    </span>
                    <input
                      {...{
                        type: "checkbox",
                        checked: column.getIsVisible(),
                        onChange: column.getToggleVisibilityHandler(),
                      }}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-sky-500 focus:ring-sky-500 sr-only"
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
