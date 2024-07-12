import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Result } from "../../../lib/result";
import {
  ColumnType,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { ThemedTextDropDown } from "./themedTextDropDown";
import {
  NumberInput,
  SearchSelect,
  SearchSelectItem,
  Select,
  SelectItem,
  TextInput,
} from "@tremor/react";
import ThemedNumberDropdown from "./themedNumberDropdown";
import SaveFilterButton from "../../templates/dashboard/saveFilterButton";
import { OrganizationFilter } from "../../../services/lib/organization_layout/organization_layout";

import FilterTreeEditor from "./FilterTreeEditor";

interface UIFilterRowNode {
  operator: "and" | "or";
  rows: UIFilterRowTree[];
}

type UIFilterRowTree = UIFilterRowNode | UIFilterRow;

export function AdvancedFilters({
  filterMap,
  filters,
  setAdvancedFilters,
  searchPropertyFilters,
  onSaveFilterCallback,
  savedFilters,
  layoutPage,
}: {
  filterMap: SingleFilterDef<any>[];
  filters: UIFilterRowTree;
  setAdvancedFilters: (filters: UIFilterRowTree) => void;
  searchPropertyFilters: (
    property: string,
    search: string
  ) => Promise<Result<void, string>>;
  onSaveFilterCallback?: () => void;
  savedFilters?: OrganizationFilter[];
  layoutPage: "dashboard" | "requests";
}) {
  const [filterTree, setFilterTree] = [filters, setAdvancedFilters];

  return (
    <div className="flex flex-col bg-white dark:bg-black p-4 rounded-lg border border-gray-300 dark:border-gray-700 mt-8">
      <div className="w-full flex flex-col sm:flex-row justify-between items-center">
        <p className="text-sm text-gray-500 font-medium">Filters</p>
        <button
          onClick={() => {
            // setAdvancedFilters([]);
          }}
          className="text-xs text-gray-500 font-medium py-1 px-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          Clear All
        </button>
      </div>

      <FilterTreeEditor
        uiFilterRowTree={filterTree}
        onUpdate={setFilterTree}
        filterMap={filterMap}
        onSearchHandler={searchPropertyFilters}
      />
      <div className="flex flex-row w-full items-end justify-end">
        {onSaveFilterCallback && (
          <SaveFilterButton
            filters={filters}
            onSaveFilterCallback={onSaveFilterCallback}
            filterMap={filterMap}
            savedFilters={savedFilters}
            layoutPage={layoutPage}
          />
        )}
      </div>
    </div>
  );
}

function removeUnicodeCharacters(str: string) {
  return str.replace(/[^\x00-\x7F]/g, "");
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
  inputParams?: {
    key: string;
    param: string;
  }[];
  onSearchHandler?: (search: string) => Promise<Result<void, string>>;
}) {
  switch (type) {
    case "text":
      return (
        <TextInput
          className=""
          onChange={(e) => {
            onChange(removeUnicodeCharacters(e.target.value));
          }}
          placeholder={"text..."}
          value={value}
        />
      );
    case "number":
      return (
        <NumberInput
          className=""
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder={"number..."}
          value={value}
          enableStepper={false}
        />
      );
    case "timestamp":
      const isoToLocal = (isoValue: string) => {
        if (!isoValue) return "";

        const date = new Date(isoValue);

        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        const hours = ("0" + date.getHours()).slice(-2);
        const minutes = ("0" + date.getMinutes()).slice(-2);

        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      const handleChange = (e: any) => {
        const localDateTime = e.target.value;

        if (localDateTime) {
          onChange(localDateTime + ":00");
        } else {
          onChange("");
        }
      };
      return (
        <input
          type="datetime-local"
          name="search-field-start"
          onChange={handleChange}
          placeholder="date..."
          value={isoToLocal(value)}
          className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white text-black dark:text-white dark:bg-black shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
        />
      );
    case "text-with-suggestions":
      return (
        <ThemedTextDropDown
          options={inputParams?.map((param) => param.param) ?? []}
          onChange={(e) => onChange(e)}
          value={value}
          onSearchHandler={onSearchHandler}
        />
      );
    case "number-with-suggestions":
      return (
        <ThemedNumberDropdown
          options={inputParams ?? []}
          onChange={(e) => onChange(e)}
          value={value}
        />
      );
    case "bool":
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-black shadow-sm text-black dark:text-white focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
        >
          <option value="true">Positive</option>
          <option value="false">Negative</option>
        </select>
      );
  }
}

export type UIFilterRow = {
  filterMapIdx: number;
  operatorIdx: number;
  value: string;
};

export function AdvancedFilterRow({
  onSearchHandler,
  filter,
  filterMap,
  onDeleteHandler,
  setFilter,
  onAddFilter,
  showAddFilter,
}: {
  filterMap: SingleFilterDef<any>[];
  filter: UIFilterRow;
  setFilter: (filters: UIFilterRow) => void;
  onDeleteHandler: () => void;
  onSearchHandler: (
    property: string,
    search: string
  ) => Promise<Result<void, string>>;
  onAddFilter: () => void;
  showAddFilter?: boolean;
}) {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-3 items-left lg:items-end ml-4">
      <div className="w-full max-w-[12.5rem]">
        <SearchSelect
          value={filter.filterMapIdx.toString()}
          onValueChange={(value) => {
            const selected = Number(value);
            const label = filterMap[selected].label;
            if (label === "Feedback") {
              setFilter({
                filterMapIdx: selected,
                operatorIdx: 0,
                value: "true",
              });
            } else {
              setFilter({
                filterMapIdx: selected,
                operatorIdx: 0,
                value: "",
              });
            }
          }}
          enableClear={false}
        >
          {filterMap.map((column, i) => (
            <SearchSelectItem value={i.toString()} key={i}>
              {column.label}
            </SearchSelectItem>
          ))}
        </SearchSelect>
      </div>

      <div className="w-full max-w-[12.5rem]">
        <Select
          value={filter.operatorIdx.toString()}
          onValueChange={(value: string) => {
            const selected = Number(value);
            setFilter({
              filterMapIdx: filter.filterMapIdx,
              operatorIdx: selected,
              value: "",
            });
          }}
          enableClear={false}
        >
          {filterMap[filter.filterMapIdx]?.operators.map((operator, i) => (
            <SelectItem value={i.toString()} key={i}>
              {operator.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="w-full max-w-[20rem]">
        <AdvancedFilterInput
          type={
            filterMap[filter.filterMapIdx]?.operators[filter.operatorIdx].type
          }
          value={filter.value}
          inputParams={
            filterMap[filter.filterMapIdx]?.operators[filter.operatorIdx]
              .inputParams
          }
          onChange={(value) => {
            setFilter({
              filterMapIdx: filter.filterMapIdx,
              operatorIdx: filter.operatorIdx,
              value: value ?? "",
            });
          }}
          onSearchHandler={(search: string) =>
            onSearchHandler(
              filterMap[filter.filterMapIdx]?.column as string,
              search
            )
          }
        />
      </div>
      <div className="flex flex-row  justify-start items-center w-full pr-4 h-full">
        <div className="w-full lg:w-fit mr-4 pb-1">
          <button
            onClick={onDeleteHandler}
            className="bg-red-700  text-white rounded-md p-1 hover:bg-red-500"
          >
            <TrashIcon className="h-4" />
          </button>
        </div>
        {showAddFilter && showAddFilter === true && (
          <button
            onClick={() => onAddFilter()}
            className="border bg-gray-100 dark:bg-black border-gray-300 dark:border-gray-700 flex flex-row w-fit font-normal text-sm text-black dark:text-white hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-sky-900 dark:hover:text-sky-100 px-4 py-2 rounded-lg -mt-2 items-center justify-center"
          >
            <PlusIcon
              className=" h-3.5 flex-none text-black dark:text-white hover:bg-sky-100 hover:text-sky-900 dark:hover:bg-sky-900 dark:hover:text-sky-100"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  );
}
