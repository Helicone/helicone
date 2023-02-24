import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { clsx } from "../clsx";
import { Column } from "../../ThemedTableV2";

interface ThemedDropdownProps {
  idx: number;
  options: Column[];
  onChange: (
    idx: number,
    type: "text" | "number" | "datetime-local",
    key: string,
    value: string,
    column: Column
  ) => void;
  onTypeChange: (idx: number, column: Column) => void;
  initialSelected?: Column;
  initialValue?: string;
}

export default function ThemedDropdown(props: ThemedDropdownProps) {
  const {
    idx,
    options,
    onChange,
    onTypeChange,
    initialSelected,
    initialValue,
  } = props;
  const [selected, setSelected] = useState<Column | undefined>(initialSelected);

  const onSelectHandler = (column: Column) => {
    onTypeChange(idx, column);
    setSelected(column);
  };

  const renderType = (
    selected: Column,
    type: "text" | "number" | "datetime-local"
  ) => {
    switch (type) {
      case "text":
        return (
          <input
            type="text"
            name="search-field"
            id={`search-field-${idx}`}
            onChange={(e) =>
              onChange(idx, type, selected.key, e.target.value, selected)
            }
            placeholder={"text..."}
            value={initialValue}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
        );
      case "number":
        return (
          <input
            type="number"
            name="search-field"
            id={`search-field-${idx}`}
            onChange={(e) =>
              onChange(idx, type, selected.key, e.target.value, selected)
            }
            placeholder={"number..."}
            value={initialValue}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
        );
      case "datetime-local":
        return (
          <>
            <p className="">between</p>
            <input
              type="datetime-local"
              name="search-field-start"
              id={`search-field-start-${idx}`}
              onChange={(e) =>
                onChange(idx, type, selected.key, e.target.value, selected)
              }
              placeholder={"start date..."}
              value={initialValue}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
            />
            <p className="">and</p>
            <input
              type="datetime-local"
              name="search-field-end"
              id={`search-field-end-${idx}`}
              onChange={(e) =>
                onChange(idx, type, selected.key, e.target.value, selected)
              }
              placeholder={"end date..."}
              value={initialValue}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
            />
          </>
        );
      default:
        return "text";
    }
  };

  return (
    <div className="w-full flex flex-row items-center space-x-2">
      <div className="w-full">
        <Listbox value={selected} onChange={onSelectHandler}>
          {({ open }) => (
            <>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                  <span className="block truncate">
                    {selected?.label || "Select a column"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {options
                      .filter((option) => option.filter)
                      .map((option) => (
                        <Listbox.Option
                          key={option.key}
                          className={({ active }) =>
                            clsx(
                              active
                                ? "text-white bg-indigo-600"
                                : "text-gray-900",
                              "relative cursor-default select-none py-2 pl-3 pr-9"
                            )
                          }
                          value={option}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={clsx(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate"
                                )}
                              >
                                {option.label}
                              </span>

                              {selected ? (
                                <span
                                  className={clsx(
                                    active ? "text-white" : "text-indigo-600",
                                    "absolute inset-y-0 right-0 flex items-center pr-4"
                                  )}
                                >
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      </div>

      {selected ? (
        <>
          <p className="">is</p>
          {renderType(selected, selected.type || "text")}
        </>
      ) : (
        <div className="w-full" />
      )}
    </div>
  );
}
