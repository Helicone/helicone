import { Listbox, Popover, Transition } from "@headlessui/react";
import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  Dispatch,
  Fragment,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { Result } from "../../../lib/result";
import {
  ColumnType,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
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
  setAdvancedFilters: Dispatch<SetStateAction<UIFilterRow[]>>;
  searchPropertyFilters: (
    property: string,
    search: string
  ) => Promise<Result<void, string>>;
}) {
  return (
    <div className="flex flex-col bg-white p-4 rounded-md border border-gray-300 border-dashed mt-8">
      <p className="text-md text-gray-500">Filters</p>
      <div className="flex flex-col gap-2 bg-white space-y-2 mt-4">
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

                    return newFilters;
                  });
                }}
                onSearchHandler={searchPropertyFilters}
              />
            </div>
          );
        })}
        <button
          onClick={() => {
            setAdvancedFilters((prev) => {
              return [...prev, { filterMapIdx: 0, value: "", operatorIdx: 0 }];
            });
          }}
          className="bg-white ml-4 flex flex-row w-fit items-center justify-center font-normal text-sm text-black hover:bg-sky-100 hover:text-sky-900 px-4 py-2 rounded-lg"
        >
          <PlusIcon
            className="mr-1 h-3.5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
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
          value={value}
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
          value={value}
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
            onSearchHandler={onSearchHandler}
          />
        </>
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
  setFilter: Dispatch<SetStateAction<UIFilterRow>>;
  onDeleteHandler: () => void;
  onSearchHandler: (
    property: string,
    search: string
  ) => Promise<Result<void, string>>;
}) {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-3 items-left lg:items-center">
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
        className="w-full lg:w-fit min-w-[150px]"
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
          setFilter((f) => ({
            ...f,
            operatorIdx: selected,
            value: "",
          }));
        }}
        className="w-full lg:w-fit min-w-[75px]"
      />

      <div className="w-full lg:w-fit min-w-[150px]">
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
            setFilter((f) => ({
              ...f,
              value: value ?? "",
            }));
          }}
          onSearchHandler={(search: string) =>
            onSearchHandler(
              filterMap[filter.filterMapIdx]?.column as string,
              search
            )
          }
        />
      </div>
      <div className="w-full lg:w-fit">
        <button
          onClick={onDeleteHandler}
          className="bg-red-500 text-white rounded-md p-2 hover:bg-red-700"
        >
          <TrashIcon className="h-4" />
        </button>
      </div>
    </div>
  );
}
