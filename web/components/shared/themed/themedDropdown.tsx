import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { clsx } from "../clsx";
import { Column } from "../../ThemedTableV2";
import { TrashIcon } from "@heroicons/react/24/outline";

interface ThemedDropdownProps {
  idx: number;
  options: Column[];
  onChange: (
    idx: number,
    type: "text" | "number" | "datetime-local",
    key: string,
    value: string,
    column: Column,
    operator: "eq" | "gt" | "lt"
  ) => void; // handles the actual input value changing
  onTypeChange: (idx: number, column: Column) => void; // handles changing the filter type
  onOperatorChange: (idx: number, operator: "eq" | "gt" | "lt") => void; // handles changing the filter operator (eq, gt, lt
  onDelete: (idx: number) => void;
  initialOperator?: "eq" | "gt" | "lt";
  initialSelected?: Column;
  initialValue?: string;
}

export default function ThemedDropdown(props: ThemedDropdownProps) {
  const {
    idx,
    options,
    onChange,
    onTypeChange,
    onDelete,
    onOperatorChange,
    initialOperator = "eq",
    initialSelected,
    initialValue,
  } = props;
  const [selected, setSelected] = useState<Column | undefined>(initialSelected);
  const [operator, setOperator] = useState<"eq" | "gt" | "lt">(initialOperator);

  const operatorMap = [
    {
      key: "eq",
      label: "is equal to",
    },
    {
      key: "gt",
      label: "is greater than",
    },
    {
      key: "lt",
      label: "is less than",
    },
  ];

  const textOperatorMap = [
    {
      key: "eq",
      label: "is equal to",
    },
  ];

  const currentOperatorMap =
    selected?.type === "text" ? textOperatorMap : operatorMap;

  const onSelectHandler = (column: Column) => {
    onTypeChange(idx, column);
    setOperator("eq");
    setSelected(column);
  };

  const onOperatorChangeHandler = (operator: "eq" | "gt" | "lt") => {
    onOperatorChange(idx, operator);
    setOperator(operator);
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
              onChange(
                idx,
                type,
                selected.key,
                e.target.value,
                selected,
                operator
              )
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
              onChange(
                idx,
                type,
                selected.key,
                e.target.value,
                selected,
                operator
              )
            }
            placeholder={"number..."}
            value={initialValue}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
        );
      case "datetime-local":
        return (
          <input
            type="datetime-local"
            name="search-field-start"
            id={`search-field-start-${idx}`}
            onChange={(e) =>
              onChange(
                idx,
                type,
                selected.key,
                e.target.value,
                selected,
                operator
              )
            }
            placeholder={"date..."}
            value={initialValue}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
        );
      default:
        return "text";
    }
  };

  return (
    <div className="w-full items-center grid grid-cols-12 gap-4">
      <div className="col-span-4">
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

      {selected && (
        <div className="flex flex-row col-span-2">
          <Listbox value={operator} onChange={onOperatorChangeHandler}>
            {({ open }) => (
              <>
                <div className="relative items-center w-full">
                  <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                    <span className="block truncate">
                      {operatorMap.find((op) => op.key === operator)?.label}
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
                      {currentOperatorMap.map((operator, index) => (
                        <Listbox.Option
                          key={`${operator.key}-${index}`}
                          className={({ active }) =>
                            clsx(
                              active
                                ? "text-white bg-indigo-600"
                                : "text-gray-900",
                              "relative cursor-default select-none py-2 pl-3 pr-9"
                            )
                          }
                          value={operator.key}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={clsx(
                                  selected ? "font-semibold" : "font-normal",
                                  "block truncate"
                                )}
                              >
                                {operator.label}
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
      )}
      {selected && (
        <div className="flex flex-row col-span-4 w-full">
          {renderType(selected, selected.type || "text")}
        </div>
      )}
      <div className="">
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-red-600 p-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
          onClick={() => onDelete(idx)}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
