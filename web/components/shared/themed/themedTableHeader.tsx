/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/

import { Menu, Popover, Transition } from "@headlessui/react";
import {
  ArrowDownTrayIcon,
  ArrowsPointingOutIcon,
  FunnelIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  PlusIcon,
  Square3Stack3DIcon,
  TrashIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { clsx } from "../clsx";
import ThemedTimeFilter from "./themedTimeFilter";
import { UserMetric } from "../../../lib/api/users/users";
import { FilterLeaf } from "../../../services/lib/filters/filterDefs";
import {
  ColumnType,
  requestTableFilters,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";

import { RequestWrapper } from "../../templates/requests/useRequestsPage";
import { Column } from "../../ThemedTableV2";
import ThemedToggle from "./themedTabs";
import ThemedDropdown from "./themedDropdown";
import { ThemedTextDropDown } from "./themedTextDropDown";

export function escapeCSVString(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  return s.replace(/"/g, '""');
}
export type Filter = FilterLeaf;

interface ThemedHeaderProps {
  isFetching: boolean; // if fetching, we disable other time select buttons
  editColumns?: {
    columns: Column[];
    onColumnCallback: (columns: Column[]) => void;
  };
  csvExport?: {
    data: any[];
    fileName: string;
  };
  timeFilter?: {
    timeFilterOptions: { key: string; value: string }[];
    customTimeFilter: boolean;
    onTimeSelectHandler: (key: TimeInterval, value: string) => void;
    defaultTimeFilter: TimeInterval;
  };
  advancedFilter?: {
    filterMap: SingleFilterDef<any>[];
    onAdvancedFilter: (advancedFilters: Filter[]) => void;
  };
  view?: {
    viewMode: string;
    setViewMode: Dispatch<SetStateAction<"Condensed" | "Expanded">>;
  };
}

export default function ThemedHeader(props: ThemedHeaderProps) {
  const {
    isFetching,
    editColumns,
    timeFilter,
    advancedFilter,
    csvExport,
    view,
  } = props;

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <div className="">
      {/* Filters */}
      <div aria-labelledby="filter-heading" className="grid items-center">
        <h2 id="filter-heading" className="sr-only">
          Filters
        </h2>
        <div className="flex flex-col lg:flex-row items-start gap-4 justify-between lg:items-center pb-3">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-2 sm:items-center">
            {timeFilter && (
              <ThemedTimeFilter
                timeFilterOptions={timeFilter.timeFilterOptions}
                isFetching={isFetching}
                onSelect={(key, value) =>
                  timeFilter.onTimeSelectHandler(key as TimeInterval, value)
                }
                defaultValue={timeFilter.defaultTimeFilter ?? "all"}
                custom={timeFilter.customTimeFilter}
              />
            )}
          </div>
          <div className="flex flex-wrap space-x-1 items-center">
            {editColumns && (
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
                      <span>View Columns</span>
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
                                onClick={() => {
                                  const newColumns = [...editColumns.columns];

                                  newColumns.forEach((col) => {
                                    col.active = false;
                                  });

                                  editColumns.onColumnCallback(newColumns);
                                }}
                                className="text-xs flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100 rounded-t-lg border-b border-gray-900/5"
                              >
                                <MinusCircleIcon
                                  className="h-4 w-4 flex-none text-gray-400"
                                  aria-hidden="true"
                                />
                                Deselect All
                              </button>
                              <button
                                onClick={() => {
                                  const newColumns = [...editColumns.columns];

                                  newColumns.forEach((col) => {
                                    col.active = true;
                                  });

                                  editColumns.onColumnCallback(newColumns);
                                }}
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
                                {editColumns.columns.map((col, idx) => (
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
                                      onChange={(e) => {
                                        const newColumns = [
                                          ...editColumns.columns,
                                        ];
                                        const col = newColumns[idx];
                                        col.active = e.target.checked;

                                        editColumns.onColumnCallback(
                                          newColumns
                                        );
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
            )}
            {advancedFilter && (
              <div className="text-sm mx-auto flex">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={clsx(
                    showAdvancedFilters
                      ? "bg-sky-100 text-sky-900"
                      : "hover:bg-sky-100 hover:text-sky-900",
                    "group flex items-center font-medium text-black px-4 py-2 rounded-lg"
                  )}
                >
                  <FunnelIcon
                    className={clsx(
                      showAdvancedFilters
                        ? "bg-sky-100 text-sky-900"
                        : "hover:bg-sky-100 hover:text-sky-900",
                      "mr-2 h-5 flex-none"
                    )}
                    aria-hidden="true"
                  />
                  <p className="text-sm">
                    {showAdvancedFilters ? `Hide Filters` : `Show Filters`}{" "}
                    {advancedFilters.length > 0
                      ? `(${advancedFilters.length})`
                      : ""}
                  </p>
                </button>
              </div>
            )}

            {csvExport && (
              <div className="mx-auto flex text-sm">
                <Menu as="div" className="relative inline-block">
                  <CSVLink
                    data={csvExport.data}
                    filename={csvExport.fileName}
                    className="flex"
                    target="_blank"
                  >
                    <button className="group inline-flex items-center justify-center font-medium text-black hover:bg-sky-100 hover:text-sky-900 px-4 py-2 rounded-lg">
                      <ArrowDownTrayIcon
                        className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                        aria-hidden="true"
                      />
                      Export
                    </button>
                  </CSVLink>
                </Menu>
              </div>
            )}
            {view && (
              <div className="mx-auto flex text-sm">
                <ThemedToggle
                  options={[
                    {
                      label: "Condensed",
                      icon: Square3Stack3DIcon,
                    },
                    {
                      label: "Expanded",
                      icon: ArrowsPointingOutIcon,
                    },
                  ]}
                  onOptionSelect={(option) =>
                    view.setViewMode(option as "Condensed" | "Expanded")
                  }
                />
              </div>
            )}
          </div>
        </div>

        {advancedFilter && (
          <div
            className={clsx(
              showAdvancedFilters ? "block" : "hidden",
              "border border-gray-300 border-dashed bg-white rounded-lg p-4 mt-2 mb-4 shadow-sm space-y-4"
            )}
          >
            <div className="text-sm text-gray-500">Filters</div>
            <div className="space-y-4 ml-0 sm:ml-4">
              {advancedFilter.filterMap && (
                <AdvancedFilters
                  filterMap={advancedFilter.filterMap}
                  filters={advancedFilters}
                  setAdvancedFilters={setAdvancedFilters}
                />
              )}
            </div>

            <button
              onClick={() => {
                setAdvancedFilters((prev) => {
                  return [
                    ...prev,
                    { filterMapIdx: 0, value: "", operatorIdx: 0 },
                  ];
                });
              }}
              className="ml-4 flex flex-row items-center justify-center font-normal text-sm text-black hover:bg-sky-100 hover:text-sky-900 px-3 py-1.5 rounded-lg"
            >
              <PlusIcon
                className="mr-2 h-4 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                aria-hidden="true"
              />
              Add Filter
            </button>
            <div className="w-full flex justify-end gap-4">
              <button
                onClick={() => {
                  setAdvancedFilters([]);
                  advancedFilter.onAdvancedFilter([]);
                }}
                className={clsx(
                  "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                )}
              >
                Clear
              </button>
              <button
                onClick={() => {
                  advancedFilter.onAdvancedFilter(
                    advancedFilters.map((filter) => {
                      const table =
                        advancedFilter.filterMap[filter.filterMapIdx].table;
                      const column =
                        advancedFilter.filterMap[filter.filterMapIdx].column;
                      const operator =
                        advancedFilter.filterMap[filter.filterMapIdx].operators[
                          filter.operatorIdx
                        ];
                      let filterLeaf: any = {};
                      filterLeaf[table] = {};
                      filterLeaf[table][column] = {};
                      filterLeaf[table][column][operator.value] = filter.value;
                      return filterLeaf;
                    })
                  );
                }}
                className={clsx(
                  "relative inline-flex items-center rounded-md hover:bg-gray-700 bg-black px-4 py-2 text-sm font-medium text-white"
                )}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdvancedFilters({
  filterMap,
  filters,
  setAdvancedFilters,
}: {
  filterMap: SingleFilterDef<any>[];
  filters: UIFilterRow[];
  setAdvancedFilters: Dispatch<SetStateAction<UIFilterRow[]>>;
}) {
  return (
    <div className="space-y-4">
      {filters.map((_filter, index) => {
        return (
          <div key={index}>
            <AdvancedFilterRow
              filterMap={filterMap}
              filter={_filter}
              setFilter={(filter) => {
                setAdvancedFilters((prev) => {
                  if (typeof filter === "function") {
                    filter = filter(prev[index]);
                  }
                  const newFilters = [...prev];
                  newFilters[index] = filter;
                  return newFilters;
                });
              }}
              onDeleteHandler={() => {
                setAdvancedFilters((prev) => {
                  const newFilters = [...prev];
                  newFilters.splice(index, 1);
                  console.log("newFilters", newFilters);
                  return newFilters;
                });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function AdvancedFilterInput({
  type,
  value,
  onChange,
  inputParams,
}: {
  type: ColumnType;
  value: string;
  onChange: (value: string) => void;
  inputParams?: string[];
}) {
  switch (type) {
    case "text":
      return (
        <input
          type="text"
          onChange={(e) => onChange(e.target.value)}
          placeholder={"text..."}
          value={value}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
        />
      );
    case "number":
      return (
        <input
          type="number"
          name="search-field"
          onChange={(e) => onChange(e.target.value)}
          placeholder={"number..."}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
        />
      );
    case "timestamp":
      return (
        <input
          type="datetime-local"
          name="search-field-start"
          onChange={(e) => onChange(e.target.value)}
          placeholder={"date..."}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
        />
      );
    case "text-with-suggestions":
      return (
        <>
          <ThemedTextDropDown
            options={inputParams ?? []}
            onChange={(e) => onChange(e)}
            value={value}
          />
        </>
      );
  }
}

type UIFilterRow = {
  filterMapIdx: number;
  operatorIdx: number;
  value: string;
};

function AdvancedFilterRow({
  filterMap,
  filter,
  setFilter,
  onDeleteHandler,
}: {
  filterMap: SingleFilterDef<any>[];
  filter: UIFilterRow;
  setFilter: Dispatch<SetStateAction<UIFilterRow>>;
  onDeleteHandler: () => void;
}) {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-2 items-left lg:items-center">
      <ThemedDropdown
        options={filterMap.map((column, i) => {
          return {
            value: i,
            label: column.label,
            category: column.category,
          };
        })}
        selectedValue={filter.filterMapIdx}
        onSelect={(selected) => {
          setFilter({
            filterMapIdx: selected,
            operatorIdx: 0,
            value: "",
          });
        }}
        className="w-full lg:w-fit"
        label="Column"
      />

      <ThemedDropdown
        options={filterMap[filter.filterMapIdx].operators.map((operator, i) => {
          return {
            value: i,
            label: operator.label,
          };
        })}
        selectedValue={filter.operatorIdx}
        onSelect={(selected) => {
          setFilter((f) => ({
            ...f,
            operatorIdx: selected,
            value: "",
          }));
        }}
        className="w-full lg:w-fit"
      />

      <div className="w-full lg:w-fit">
        <AdvancedFilterInput
          type={
            filterMap[filter.filterMapIdx].operators[filter.operatorIdx].type
          }
          value={filter.value}
          inputParams={
            filterMap[filter.filterMapIdx].operators[filter.operatorIdx]
              .inputParams
          }
          onChange={(value) => {
            setFilter((f) => ({
              ...f,
              value,
            }));
          }}
        />
      </div>

      <div className="w-full lg:w-fit border-b pb-4 lg:border-b-0 lg:pb-0 justify-end flex lg:justify-center">
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-red-600 p-1.5 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
          onClick={() => onDeleteHandler()}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
