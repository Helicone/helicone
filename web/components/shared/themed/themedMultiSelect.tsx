import { Popover, Transition } from "@headlessui/react";
import { clsx } from "../clsx";
import {
  MinusCircleIcon,
  PlusCircleIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { Fragment } from "react";

export const ThemedMultiSelect = ({
  columns,
  buttonLabel,
  onSelect,
  deselectAll,
  selectAll,
  align = "left",
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
  align?: "left" | "right";
}) => {
  return (
    <Popover className="relative text-sm">
      {({ open }) => (
        <>
          <Popover.Button className="flex flex-row items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 hover:bg-sky-50">
            <TagIcon className="h-5 w-5 text-gray-900" />
            <p className="hidden text-sm font-medium text-gray-900 sm:block">
              {`${buttonLabel} (${
                columns.filter((col) => col.active).length
              } / ${columns.length})`}
            </p>
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
            <Popover.Panel
              className={clsx(
                align === "left" ? "left-0" : "right-0",
                "absolute z-10 mt-2.5 flex",
              )}
            >
              {({ close }) => (
                <div className="flex-auto rounded-lg bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
                  <div className="grid grid-cols-2 divide-x divide-gray-900/5 rounded-t-lg bg-gray-50">
                    <button
                      onClick={deselectAll}
                      className="flex items-center justify-center gap-x-2.5 rounded-t-lg border-b border-gray-900/5 p-3 text-xs font-semibold text-gray-900 hover:bg-gray-100"
                    >
                      <MinusCircleIcon
                        className="h-4 w-4 flex-none text-gray-400"
                        aria-hidden="true"
                      />
                      Deselect All
                    </button>
                    <button
                      onClick={selectAll}
                      className="flex items-center justify-center gap-x-2.5 border-b border-gray-900/5 p-3 text-xs font-semibold text-gray-900 hover:bg-gray-100"
                    >
                      <PlusCircleIcon
                        className="h-4 w-4 flex-none text-gray-400"
                        aria-hidden="true"
                      />
                      Select All
                    </button>
                  </div>
                  <fieldset className="h-[350px] w-[250px] flex-auto overflow-auto rounded-b-lg bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
                    <div className="divide-y divide-gray-200 border-gray-200">
                      {columns.map((col, idx) => (
                        <label
                          key={idx}
                          htmlFor={`person-${col.label}`}
                          className="relative flex w-full select-none items-center justify-between p-4 font-medium text-gray-900 hover:cursor-pointer hover:bg-gray-50"
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
