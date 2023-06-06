import { Popover, Transition } from "@headlessui/react";
import { clsx } from "../clsx";
import {
  MinusCircleIcon,
  PlusCircleIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { Fragment } from "react";

export const ThemedMultiSelect = ({
  columns,
  buttonLabel,
  onSelect,
  deselectAll,
  selectAll,
}: {
  columns: {
    label: string;
    active: boolean;
    value: string;
  }[];
  buttonLabel: string;
  onSelect: (value: string) => void;
  deselectAll: () => void;
  selectAll: () => void;
}) => {
  return (
    <Popover className="relative text-sm">
      {({ open }) => (
        <>
          <Popover.Button
            className={clsx(
              open
                ? "bg-sky-100 text-sky-900"
                : "hover:bg-sky-100 hover:text-sky-900",
              "group flex items-center font-medium text-black px-4 py-2 rounded-lg"
            )}
          >
            <ViewColumnsIcon
              className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
              aria-hidden="true"
            />

            <span className="sm:inline hidden lg:inline">
              {`${buttonLabel} (${
                columns.filter((col) => col.active).length
              } / ${columns.length})`}
            </span>
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute left-0 z-10 mt-2.5 flex">
              {({ close }) => (
                <div className="flex-auto rounded-lg bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
                  <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50 rounded-t-lg">
                    <button
                      onClick={deselectAll}
                      className="text-xs flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100 rounded-t-lg border-b border-gray-900/5"
                    >
                      <MinusCircleIcon
                        className="h-4 w-4 flex-none text-gray-400"
                        aria-hidden="true"
                      />
                      Deselect All
                    </button>
                    <button
                      onClick={selectAll}
                      className="text-xs flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100 border-b border-gray-900/5"
                    >
                      <PlusCircleIcon
                        className="h-4 w-4 flex-none text-gray-400"
                        aria-hidden="true"
                      />
                      Select All
                    </button>
                  </div>
                  <fieldset className="w-[250px] h-[350px] overflow-auto flex-auto bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5 rounded-b-lg">
                    <div className="divide-y divide-gray-200 border-gray-200">
                      {columns.map((col, idx) => (
                        <label
                          key={idx}
                          htmlFor={`person-${col.label}`}
                          className="relative p-4 select-none font-medium text-gray-900 w-full justify-between items-center flex hover:bg-gray-50 hover:cursor-pointer"
                        >
                          <span>{col.label}</span>
                          <input
                            id={`person-${col.label}`}
                            name={`person-${col.label}`}
                            type="checkbox"
                            checked={col.active}
                            onChange={() => {
                              onSelect(col.value);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-600"
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};
