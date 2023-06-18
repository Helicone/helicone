import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
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
        <Menu.Button className="items-center flex font-semibold text-gray-900 text-sm rounded-lg hover:text-sky-900 hover:bg-sky-100 px-4 py-2">
          <ViewColumnsIcon className="h-5 w-5 mr-2 inline-block" />
          Columns {`( ${visibleColumns} / ${columns.length} )`}
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
        <Menu.Items className="absolute z-10 right-0 mt-2 w-[250px] origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50 rounded-t-lg">
            <button
              onClick={() => onSelectAll(false)}
              className="text-xs flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100 rounded-t-lg border-b border-gray-900/5"
            >
              <MinusCircleIcon
                className="h-4 w-4 flex-none text-gray-400"
                aria-hidden="true"
              />
              Deselect All
            </button>
            <button
              onClick={() => onSelectAll(true)}
              className="text-xs flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100 border-b border-gray-900/5"
            >
              <PlusCircleIcon
                className="h-4 w-4 flex-none text-gray-400"
                aria-hidden="true"
              />
              Select All
            </button>
          </div>
          <div className="px-1">
            {columns.map((column, idx) => {
              const header = column.columnDef.header as string;

              return (
                <div key={idx}>
                  <div
                    key={column.id}
                    className={clsx(idx !== 0 && "border-t border-gray-200")}
                  >
                    <label
                      key={idx}
                      className="relative p-4 select-none font-medium text-gray-900 w-full justify-between items-center flex hover:bg-sky-100 hover:cursor-pointer"
                    >
                      <span className="text-sm text-gray-900 hover:text-sky-900 font-semibold">
                        {header}
                      </span>
                      <input
                        {...{
                          type: "checkbox",
                          checked: column.getIsVisible(),
                          onChange: column.getToggleVisibilityHandler(),
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-600"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
