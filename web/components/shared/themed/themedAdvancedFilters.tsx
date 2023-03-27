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
}: {
  filterMap: SingleFilterDef<any>[];
  filters: UIFilterRow[];
  setAdvancedFilters: Dispatch<SetStateAction<UIFilterRow[]>>;
}) {
  return (
    <div className="flex flex-col gap-3 bg-white p-3">
      <div className="flex flex-wrap gap-3 bg-white">
        {filters.map((_filter, index) => {
          console.log("filter34", _filter);
          return (
            <div key={index} className="rounded-md text-xs bg-white">
              <AdvancedFilterRow
                filterMap={filterMap}
                filter={_filter}
                setFilter={(filter) => {
                  setAdvancedFilters((prev) => {
                    console.log("setting filterz", filter, "to index", index);
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
        <button
          onClick={() => {
            setAdvancedFilters((prev) => {
              return [...prev, { filterMapIdx: 0, value: "", operatorIdx: 0 }];
            });
          }}
          className="bg-white ml-4 flex flex-row items-center justify-center font-normal text-sm text-black hover:bg-sky-100 hover:text-sky-900 px-5 py-1.5 rounded-lg"
        >
          <PlusIcon
            className="mr-2 h-4 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
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
}: {
  type: ColumnType;
  value: string;
  onChange: (value: string | null) => void;
  inputParams?: string[];
}) {
  console.log("value", value, "type", type, "inputParams", inputParams);
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
}: {
  filterMap: SingleFilterDef<any>[];
  filter: UIFilterRow;
  setFilter: Dispatch<SetStateAction<UIFilterRow>>;
  onDeleteHandler: () => void;
}) {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-2 items-left lg:items-center">
      <div className="flex justify-center items-center ">
        <Popover className="relative">
          {({ open }) => (
            <>
              <Popover.Button className="bg-blue-500 text-white pl-4 pr-1 py-2 rounded-md">
                <div className="flex flex-row gap-2">
                  <div>
                    {filterMap[filter.filterMapIdx].label}{" "}
                    {
                      filterMap[filter.filterMapIdx].operators[
                        filter.operatorIdx
                      ].label
                    }{" "}
                    {filter.value}
                  </div>
                  <div>
                    <XMarkIcon
                      className="h-4"
                      onClick={() => onDeleteHandler()}
                    />
                  </div>
                </div>
              </Popover.Button>
              <Popover.Panel
                className={`${
                  open ? "block" : "hidden"
                } absolute bg-white text-black p-4  rounded-md shadow-lg z-10 min-w-max`}
              >
                <div className="flex flex-row gap-2">
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
                      console.log("selectedzzz", selected);
                      setFilter({
                        filterMapIdx: selected,
                        operatorIdx: 0,
                        value: "",
                      });
                    }}
                    className="w-full lg:w-fit"
                  />

                  <ThemedDropdown
                    options={filterMap[filter.filterMapIdx].operators.map(
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
                    className="w-full lg:w-fit"
                  />

                  <div className="w-full lg:w-fit">
                    <AdvancedFilterInput
                      type={
                        filterMap[filter.filterMapIdx].operators[
                          filter.operatorIdx
                        ].type
                      }
                      value={filter.value}
                      inputParams={filterMap[filter.filterMapIdx].operators[
                        filter.operatorIdx
                      ].inputParams
                        ?.filter(
                          (param) =>
                            param.key === filterMap[filter.filterMapIdx].column
                        )
                        .map((param) => param.param)}
                      onChange={(value) => {
                        setFilter((f) => ({
                          ...f,
                          value: value ?? "",
                        }));
                      }}
                    />
                  </div>
                </div>
              </Popover.Panel>
            </>
          )}
        </Popover>
      </div>
    </div>
  );
}
