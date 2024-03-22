import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import { clsx } from "../../shared/clsx";

interface ViewColumnsProps<T> {
  columns: Column<T, unknown>[];
  onSelectAll: (value?: boolean | undefined) => void;
  visibleColumns: number;
}

export default function ViewColumns<T>(props: ViewColumnsProps<T>) {
  const { columns, onSelectAll, visibleColumns } = props;

  const { defaultColumns, customColumns } = columns.reduce(
    (acc, column) => {
      const id = column.columnDef.id as string;
      // if the id starts with `Custom -` then it is a custom property
      const isCustomProperty = id?.startsWith("Custom -") ?? false;
      if (isCustomProperty) {
        acc.customColumns.push(column);
      } else {
        acc.defaultColumns.push(column);
      }
      return acc;
    },
    {
      defaultColumns: [] as Column<T, unknown>[],
      customColumns: [] as Column<T, unknown>[],
    }
  );

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <div className="text-sm font-medium items-center text-gray-900 dark:text-gray-100 hidden sm:flex gap-1">
            Columns{" "}
            <span className="text-gray-500 text-xs">{`( ${visibleColumns} / ${columns.length} )`}</span>
          </div>
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
        <Menu.Items className="border border-gray-300 dark:border-gray-700 absolute z-10 right-0 mt-2 w-[400px] origin-top-right rounded-lg bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-4 flex flex-col space-y-2 divide-y divide-gray-200">
            <h3 className="text-xs text-black dark:text-white font-medium">
              Column Options
            </h3>
            <div className="flex flex-col space-y-2 pt-2">
              <p className="text-xs text-gray-500 font-medium">
                Display Properties
              </p>
              <ul className="flex flex-wrap gap-2">
                {defaultColumns.map((column) => {
                  const header = column.columnDef.header as string;
                  return (
                    <li key={column.id}>
                      <button
                        onClick={column.getToggleVisibilityHandler()}
                        className={clsx(
                          column.getIsVisible()
                            ? "bg-sky-100 dark:bg-sky-900 text-sky-700 font-medium hover:text-sky-900 dark:hover:text-sky-100 dark:text-sky-300"
                            : "bg-white dark:bg-black text-gray-500 hover:bg-sky-50 dark:hover:bg-sky-900 hover:text-sky-900 dark:hover:text-sky-100",
                          "text-xs border border-gray-300 dark:border-gray-700 w-fit px-2 py-1 rounded-md whitespace-pre-wrap text-left"
                        )}
                      >
                        {header}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-col space-y-2 pt-2">
              <p className="text-xs text-gray-500 font-medium">
                Custom Properties
              </p>
              <ul className="flex flex-col gap-2">
                {customColumns.map((column) => {
                  const header = column.columnDef.header as string;
                  return (
                    <li key={column.id}>
                      <button
                        onClick={column.getToggleVisibilityHandler()}
                        className={clsx(
                          column.getIsVisible()
                            ? "bg-sky-100 dark:bg-sky-900 text-sky-700 font-medium hover:text-sky-900 dark:hover:text-sky-100 dark:text-sky-300"
                            : "bg-white dark:bg-black text-gray-500 hover:bg-sky-50 dark:hover:bg-sky-900 hover:text-sky-900 dark:hover:text-sky-100",
                          "w-fit text-xs border border-gray-300 dark:border-gray-700 px-2 py-1 rounded-md whitespace-pre-wrap text-left"
                        )}
                      >
                        {header}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex justify-end items-center pt-2 gap-2">
              <button
                onClick={() => onSelectAll(false)}
                className="text-xs flex items-center justify-center gap-x-2.5 px-2 py-1 font-medium text-gray-500 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
              >
                Deselect All
              </button>
              <button
                onClick={() => onSelectAll(true)}
                className="text-xs flex items-center justify-center gap-x-2.5 px-2 py-1 font-medium text-gray-500 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
              >
                Select All
              </button>
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
