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
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useState } from "react";
import { CSVLink } from "react-csv";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { Column } from "../../ThemedTableV2";
import { clsx } from "../clsx";
import ThemedDropdown from "./themedDropdown";
import ThemedTimeFilter from "./themedTimeFilter";

function escapeCSVString(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  return s.replace(/"/g, '""');
}

interface ThemedFilterProps {
  data: any[] | null; // if data is null, then we don't show the export button
  isFetching: boolean; // if fetching, we disable other time select buttons
  onTimeSelectHandler?: (key: TimeInterval, value: string) => void;
  timeFilterOptions?: { key: string; value: string }[]; // if undefined, then we don't show the timeFilter dropdown
  customTimeFilter?: boolean; // if true, then we show the custom time filter
  fileName?: string; // if undefined, then we use the default file name
  columns?: Column[]; // if undefined, don't show the show filters button
  onAdvancedFilter?: (
    advancedFilters: {
      idx: number;
      type?: "number" | "text" | "datetime-local" | undefined;
      supabaseKey?: string | undefined;
      value?: string | undefined;
      column?: Column | undefined;
    }[]
  ) => void;
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
    onAdvancedFilter,
  } = props;

  const [advancedFilters, setAdvancedFilters] = useState<
    {
      idx: number;
      type?: "text" | "number" | "datetime-local";
      supabaseKey?: string;
      value?: string;
      column?: Column;
    }[]
  >([]);

  const handleFilterChange = (
    idx: number,
    type: "text" | "number" | "datetime-local",
    key: string,
    value: string,
    column: Column
  ) => {
    const newFilters = [...advancedFilters];
    newFilters[idx] = { idx, type, supabaseKey: key, value, column };
    setAdvancedFilters(newFilters);
  };

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

              {/* TODO: Add back this uncommented code once filters is functional */}

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
                            {open ? "Hide Filters" : "Show Filters"}
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
                          data={data.map((d) => ({
                            ...d,
                            request: escapeCSVString(d.request),
                            response: escapeCSVString(d.response),
                          }))}
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
                  {advancedFilters.map((filter) => (
                    <div
                      className="max-w-2xl flex flex-row items-center space-x-2"
                      key={filter.idx}
                    >
                      <div className="w-full">
                        <ThemedDropdown
                          options={columns}
                          idx={filter.idx}
                          onChange={(idx, type, key, value, column) =>
                            handleFilterChange(idx, type, key, value, column)
                          }
                          onTypeChange={(idx, column) => {
                            handleFilterChange(
                              idx,
                              column.type || "text",
                              "",
                              "",
                              column
                            );
                          }}
                          initialSelected={filter.column}
                          initialValue={filter.value}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setAdvancedFilters([
                      ...advancedFilters,
                      { idx: advancedFilters.length },
                    ])
                  }
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
                    onClick={() => console.log(advancedFilters)}
                    className="block bg-black text-white p-2 rounded-lg"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => onAdvancedFilter(advancedFilters)}
                    className="block bg-black text-white p-2 rounded-lg"
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
