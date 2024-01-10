import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Dispatch, SetStateAction } from "react";
import { Result } from "../../../lib/shared/result";
import {
  ColumnType,
  SingleFilterDef,
} from "../../../lib/shared/filters/frontendFilterDefs";
import ThemedDropdown from "./themedDropdown";
import { ThemedTextDropDown } from "./themedTextDropDown";

export function AdvancedFilters({
  filterMap,
  filters,
  setAdvancedFilters,
  searchPropertyFilters,
}: {
  filterMap: SingleFilterDef<any>[];
  filters: UIFilterRow[];
  setAdvancedFilters: (filters: UIFilterRow[]) => void;
  searchPropertyFilters: (
    property: string,
    search: string
  ) => Promise<Result<void, string>>;
}) {
  return (
    <div className="flex flex-col bg-white dark:bg-black p-4 rounded-lg border border-gray-300 dark:border-gray-700 mt-8">
      <div className="w-full flex flex-col sm:flex-row justify-between items-center">
        <p className="text-sm text-gray-500 font-medium">Filters</p>
        <button
          onClick={() => {
            setAdvancedFilters([]);
          }}
          className="text-xs text-gray-500 font-medium py-1 px-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-col gap-2 bg-white dark:bg-black space-y-2 mt-4">
        {filters.map((_filter, index) => {
          return (
            <div key={index}>
              <AdvancedFilterRow
                filterMap={filterMap}
                filter={_filter}
                setFilter={(filter) => {
                  const prev = [...filters];
                  if (typeof filter === "function") {
                    // filter = filter(prev[index]);
                  }

                  const newFilters = [...prev];
                  newFilters[index] = filter[0];
                  setAdvancedFilters(newFilters);
                }}
                onDeleteHandler={() => {
                  const prev = [...filters];
                  prev.splice(index, 1);
                  setAdvancedFilters(prev);
                }}
                onSearchHandler={searchPropertyFilters}
              />
            </div>
          );
        })}
        <button
          onClick={() => {
            const prev = [...filters];

            setAdvancedFilters([
              ...prev,
              { filterMapIdx: 0, value: "", operatorIdx: 0 },
            ]);
          }}
          className="bg-white dark:bg-black ml-4 flex flex-row w-fit items-center justify-center font-normal text-sm text-black dark:text-white hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-sky-900 dark:hover:text-sky-100 px-4 py-2 rounded-lg"
        >
          <PlusIcon
            className="mr-1 h-3.5 flex-none text-black dark:text-white hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-sky-900 dark:hover:text-sky-100"
            aria-hidden="true"
          />
          Add Filter
        </button>
      </div>
    </div>
  );
}

function AdvancedFilterInput({
  type,
  value,
  onChange,
  inputParams,
  onSearchHandler,
}: {
  type: ColumnType;
  value: string;
  onChange: (value: string | null) => void;
  inputParams?: string[];
  onSearchHandler?: (search: string) => Promise<Result<void, string>>;
}) {
  // if any of the inputs below are changed, we want to set the page number back to 1
  switch (type) {
    case "text":
      return (
        <input
          type="text"
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder={"text..."}
          value={value}
          className="block w-full sm:min-w-[25rem] rounded-md border-gray-300 dark:border-gray-700 text-black dark:text-white bg-white dark:bg-black shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
        />
      );
    case "number":
      return (
        <input
          type="number"
          name="search-field"
          onChange={(e) => onChange(e.target.value)}
          placeholder={"number..."}
          value={value}
          className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white text-black dark:text-white dark:bg-black shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
        />
      );
    case "timestamp":
      return (
        <input
          type="datetime-local"
          name="search-field-start"
          onChange={(e) => onChange(e.target.value)}
          placeholder={"date..."}
          value={value}
          className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white text-black dark:text-white dark:bg-black shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
        />
      );
    case "text-with-suggestions":
      return (
        <>
          <ThemedTextDropDown
            options={inputParams ?? []}
            onChange={(e) => onChange(e)}
            value={value}
            onSearchHandler={onSearchHandler}
          />
        </>
      );
    case "bool":
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-black shadow-sm text-black dark:text-white focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
        >
          <option value="1">Positive</option>
          <option value="0">Negative</option>
        </select>
      );
  }
}

export type UIFilterRow = {
  filterMapIdx: number;
  operatorIdx: number;
  value: string;
};

function AdvancedFilterRow({
  filterMap,
  filter,
  setFilter,
  onDeleteHandler,
  onSearchHandler,
}: {
  filterMap: SingleFilterDef<any>[];
  filter: UIFilterRow;
  setFilter: (filters: UIFilterRow[]) => void;
  onDeleteHandler: () => void;
  onSearchHandler: (
    property: string,
    search: string
  ) => Promise<Result<void, string>>;
}) {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-3 items-left lg:items-center ml-4">
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
          const label = filterMap[selected].label;
          if (label === "Feedback") {
            // feedback idx

            setFilter([
              {
                filterMapIdx: selected,
                operatorIdx: 0,
                value: "1",
              },
            ]);
          } else {
            setFilter([
              {
                filterMapIdx: selected,
                operatorIdx: 0,
                value: "",
              },
            ]);
          }
        }}
        className="w-full lg:w-fit"
      />

      <ThemedDropdown
        options={filterMap[filter.filterMapIdx]?.operators.map(
          (operator, i) => {
            return {
              value: i,
              label: operator.label,
            };
          }
        )}
        selectedValue={filter.operatorIdx}
        onSelect={(selected) => {
          setFilter([
            {
              filterMapIdx: filter.filterMapIdx,
              operatorIdx: selected,
              value: "",
            },
          ]);
        }}
        className="w-full lg:w-fit"
      />

      <div className="">
        <AdvancedFilterInput
          type={
            filterMap[filter.filterMapIdx]?.operators[filter.operatorIdx].type
          }
          value={filter.value}
          inputParams={filterMap[filter.filterMapIdx]?.operators[
            filter.operatorIdx
          ].inputParams
            ?.filter(
              (param) => param.key === filterMap[filter.filterMapIdx]?.column
            )
            .map((param) => param.param)}
          onChange={(value) => {
            setFilter([
              {
                filterMapIdx: filter.filterMapIdx,
                operatorIdx: filter.operatorIdx,
                value: value ?? "",
              },
            ]);
          }}
          onSearchHandler={(search: string) =>
            onSearchHandler(
              filterMap[filter.filterMapIdx]?.column as string,
              search
            )
          }
        />
      </div>
      <div className="w-full lg:w-fit mr-16">
        <button
          onClick={onDeleteHandler}
          className="bg-red-700  text-white rounded-md p-1 hover:bg-red-500"
        >
          <TrashIcon className="h-4" />
        </button>
      </div>
    </div>
  );
}
