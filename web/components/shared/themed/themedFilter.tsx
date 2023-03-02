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

import { Disclosure, Menu } from "@headlessui/react";
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { Column } from "../../ThemedTableV2";
import { clsx } from "../clsx";
import ThemedDropdown from "./themedDropdown";
import { UserRow } from "../../../services/lib/users";
import { Database } from "../../../supabase/database.types";
import { CsvData } from "../../templates/requests/requestsPage";

import ThemedTimeFilter from "./themedTimeFilter";
import { UserMetric } from "../../../lib/api/users/users";

import ThemedDropdownV2 from "./themedDropdownV2";
import { FilterLeaf } from "../../../services/lib/filters/filterDefs";
import {
  ColumnType,
  TableFilterMap,
} from "../../../services/lib/filters/frontendFilterDefs";

export function escapeCSVString(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  return s.replace(/"/g, '""');
}
export type Filter = (FilterLeaf & { id?: string }) | { id?: string };

interface ThemedFilterProps {
  data: CsvData[] | null | UserMetric[]; // if data is null, then we don't show the export button
  isFetching: boolean; // if fetching, we disable other time select buttons
  onTimeSelectHandler?: (key: TimeInterval, value: string) => void;
  timeFilterOptions?: { key: string; value: string }[]; // if undefined, then we don't show the timeFilter dropdown
  customTimeFilter?: boolean; // if true, then we show the custom time filter
  fileName?: string; // if undefined, then we use the default file name
  columns?: Column[]; // if undefined, don't show the show filters button
  filterMap?: TableFilterMap;
  onAdvancedFilter?: (advancedFilters: Filter[]) => void;
}

export default function ThemedFilter(props: ThemedFilterProps) {
  const {
    data,
    onTimeSelectHandler,
    isFetching,
    timeFilterOptions,
    customTimeFilter = false,
    fileName = "export.csv",
    columns,
    filterMap,
    onAdvancedFilter,
  } = props;

  const [advancedFilters, setAdvancedFilters] = useState<Filter[]>([]);

  return (
    <div className="">
      {/* Filters */}
      <Disclosure
        as="section"
        aria-labelledby="filter-heading"
        className="grid items-center"
      >
        {({ open }) => (
          <>
            <h2 id="filter-heading" className="sr-only">
              Filters
            </h2>
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-0 justify-between sm:items-center pb-3">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-2 sm:items-center">
                {timeFilterOptions && onTimeSelectHandler && (
                  <ThemedTimeFilter
                    timeFilterOptions={timeFilterOptions}
                    isFetching={isFetching}
                    onSelect={(key, value) =>
                      onTimeSelectHandler(key as TimeInterval, value)
                    }
                    defaultValue="24h"
                    custom={customTimeFilter}
                  />
                )}
              </div>
              <div className="flex flex-row space-x-2 items-center pr-2">
                {columns && (
                  <div className="text-sm">
                    <div className="mx-auto flex">
                      <div>
                        <Disclosure.Button
                          className={clsx(
                            open
                              ? "bg-sky-100 text-sky-900"
                              : "hover:bg-sky-100 hover:text-sky-900",
                            "group flex items-center font-medium text-black px-4 py-2 rounded-lg"
                          )}
                        >
                          <FunnelIcon
                            className={clsx(
                              open
                                ? "bg-sky-100 text-sky-900"
                                : "hover:bg-sky-100 hover:text-sky-900",
                              "mr-2 h-5 flex-none"
                            )}
                            aria-hidden="true"
                          />
                          <p className="text-sm">
                            {open ? `Hide Filters` : `Show Filters`}{" "}
                            {advancedFilters.length > 0
                              ? `(${advancedFilters.length})`
                              : ""}
                          </p>
                        </Disclosure.Button>
                      </div>
                    </div>
                  </div>
                )}

                {data !== null && (
                  <div className="pl-0 sm:pl-2">
                    <div className="mx-auto flex">
                      <Menu as="div" className="relative inline-block">
                        <CSVLink
                          data={data.map((d) => {
                            if ("request" in d) {
                              return {
                                ...d,
                                request: escapeCSVString(d.request),
                                response: escapeCSVString(d.response),
                              };
                            } else {
                              return d;
                            }
                          })}
                          filename={fileName}
                          className="flex"
                          target="_blank"
                        >
                          <button className="group inline-flex items-center justify-center text-sm font-medium text-black hover:bg-sky-100 hover:text-sky-900 px-4 py-2 rounded-lg">
                            <ArrowDownTrayIcon
                              className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                              aria-hidden="true"
                            />
                            Export
                          </button>
                        </CSVLink>
                      </Menu>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {columns && onAdvancedFilter && (
              <Disclosure.Panel className="border border-gray-300 border-dashed bg-white rounded-lg p-4 mt-2 mb-4 shadow-sm space-y-4">
                <p className="text-sm text-gray-500">Filters</p>
                <div className="space-y-4 ml-4">
                  {filterMap && (
                    <AdvancedFilters
                      filterMap={filterMap}
                      filters={advancedFilters}
                      setAdvancedFilters={setAdvancedFilters}
                    />
                  )}
                </div>

                <button
                  onClick={() => {
                    setAdvancedFilters((prev) => {
                      return [...prev, { id: crypto.randomUUID() }];
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
                      // onAdvancedFilter([]);
                      setAdvancedFilters([]);
                    }}
                    className={clsx(
                      "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                    )}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => onAdvancedFilter(advancedFilters)}
                    className={clsx(
                      "relative inline-flex items-center rounded-md hover:bg-gray-700 bg-black px-4 py-2 text-sm font-medium text-white"
                    )}
                  >
                    Save
                  </button>
                </div>
              </Disclosure.Panel>
            )}
          </>
        )}
      </Disclosure>
    </div>
  );
}

function AdvancedFilters({
  filterMap,
  filters,
  setAdvancedFilters,
}: {
  filterMap: TableFilterMap;
  filters: Filter[];
  setAdvancedFilters: Dispatch<SetStateAction<Filter[]>>;
}) {
  return (
    <>
      {filters.map((_filter, index) => {
        return (
          <div key={_filter.id}>
            <AdvancedFilterRow
              filterMap={filterMap}
              handleFilterChange={(filter) => {
                setAdvancedFilters((prev) => {
                  const newFilters = [...prev];
                  newFilters[index] = filter;
                  newFilters[index].id = _filter.id;
                  return newFilters;
                });
              }}
              onDeleteHandler={() => {
                setAdvancedFilters((prev) => {
                  const newFilters = [...prev];
                  newFilters[index].id = _filter.id;
                  newFilters.splice(index, 1);
                  console.log("newFilters", newFilters);
                  return newFilters;
                });
              }}
            />
          </div>
        );
      })}
    </>
  );
}

function AdvancedFilterInput({
  type,
  value,
  onChange,
}: {
  type: ColumnType;
  value: string;
  onChange: (value: string) => void;
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
    default:
      return <></>;
  }
}

function AdvancedFilterRow({
  filterMap,
  handleFilterChange,
  onDeleteHandler,
}: {
  filterMap: TableFilterMap;
  handleFilterChange: (filter: FilterLeaf) => void;
  onDeleteHandler: () => void;
}) {
  const tables = Object.entries(filterMap);

  const [table, setTable] = useState(tables[0][0]);

  const columns = tables.find((t) => t[0] === table)?.[1].columns;
  const columnsEntries = columns ? Object.entries(columns) : null;
  const [column, setColumn] = useState(
    columnsEntries && columnsEntries[0] ? columnsEntries[0][0] : ""
  );

  const operators =
    (columnsEntries && columnsEntries.find((c) => c[0] === column)?.[1]) ??
    null;
  const operatorsEntries = operators
    ? Object.entries(operators.operations)
    : [];
  const [operator, setOperator] = useState(
    operatorsEntries && operatorsEntries[0] ? operatorsEntries[0][0] : ""
  );

  const selectedOperator = operatorsEntries.find((o) => o[0] === operator)?.[1];

  const [value, setValue] = useState("");

  useEffect(() => {
    setColumn(columnsEntries ? columnsEntries[0][0] : "");
    setValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
  useEffect(() => {
    setOperator(operatorsEntries ? operatorsEntries[0][0] : "");
    setValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column]);

  return (
    <div className="w-full justify-between flex flex-row items-center space-x-4">
      <div className="w-full grid grid-cols-12 gap-4">
        <ThemedDropdownV2
          options={tables.map((table) => {
            return {
              value: table[0],
              label: table[1].label,
            };
          })}
          selectedValue={table}
          onSelect={(selected) => {
            setTable(selected);
          }}
          className="col-span-2"
        />
        {columnsEntries && (
          <ThemedDropdownV2
            options={columnsEntries.map((column) => {
              return {
                value: column[0],
                label: column[1].label,
              };
            })}
            selectedValue={column}
            onSelect={(selected) => {
              setColumn(selected);
            }}
            className="col-span-3"
          />
        )}

        {column && (
          <ThemedDropdownV2
            options={operatorsEntries.map((operator) => {
              return {
                value: operator[0],
                label: operator[0],
              };
            })}
            selectedValue={operator}
            onSelect={(selected) => {
              setOperator(selected);
            }}
            className="col-span-2"
          />
        )}
        {selectedOperator && (
          <div className="col-span-3">
            <AdvancedFilterInput
              type={selectedOperator.type}
              value={value}
              onChange={(value) => {
                let filter: any = {};
                filter[table] = {};
                filter[table][column] = {};
                filter[table][column][operator] = value;
                handleFilterChange(filter);
                setValue(value);
              }}
            />
          </div>
        )}
        <div className="col-span-2">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-red-600 p-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
            onClick={() => onDeleteHandler()}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
