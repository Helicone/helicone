import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2Icon } from "lucide-react";
import { Result } from "../../../lib/result";
import {
  ColumnType,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../services/lib/organization_layout/organization_layout";
import FilterTreeEditor from "./FilterTreeEditor";
import ThemedNumberDropdown from "./themedNumberDropdown";
import { ThemedTextDropDown } from "./themedTextDropDown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className="w-full flex flex-col bg-white p-4 dark:bg-black rounded-lg">
      <div className="w-full flex items-center justify-between mb-3">
        <h3 className="text-xs text-slate-900 font-semibold">Filters</h3>
        <button
          onClick={() => {
            setAdvancedFilters({ operator: "and", rows: [] });
          }}
          className="text-xs text-slate-500 font-medium rounded-md"
        >
          Clear All
        </button>
      </div>

      <FilterTreeEditor
        uiFilterRowTree={filterTree}
        onUpdate={setFilterTree}
        filterMap={filterMap}
        onSearchHandler={searchPropertyFilters}
        filters={filters}
        onSaveFilterCallback={onSaveFilterCallback}
        savedFilters={savedFilters}
        layoutPage={layoutPage}
      />
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
        <Input
          onChange={(e) => {
            onChange(removeUnicodeCharacters(e.target.value));
          }}
          className="text-xs text-slate-900 dark:text-slate-100"
          placeholder="text..."
          value={value}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder="number..."
          value={value}
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

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const localDateTime = e.target.value;

        if (localDateTime) {
          onChange(localDateTime + ":00");
        } else {
          onChange("");
        }
      };

      return (
        <Input
          type="datetime-local"
          onChange={handleChange}
          placeholder="date..."
          value={isoToLocal(value)}
          className="text-xs h-4"
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
        <Select value={value} onValueChange={(newValue) => onChange(newValue)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Positive</SelectItem>
            <SelectItem value="false">Negative</SelectItem>
          </SelectContent>
        </Select>
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
    <div className="w-full flex flex-col md:grid md:grid-cols-4 gap-3 items-left md:items-center ml-4">
      <div className="w-full text-xs">
        <Select
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
        >
          <SelectTrigger className="w-full max-w-[12.5rem]">
            <SelectValue placeholder="Select a filter" />
          </SelectTrigger>
          <SelectContent>
            {filterMap.map((column, i) => (
              <SelectItem key={i} value={i.toString()}>
                {column.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        >
          <SelectTrigger className="w-full max-w-[12.5rem]">
            <SelectValue placeholder="Select an operator" />
          </SelectTrigger>
          <SelectContent>
            {filterMap[filter.filterMapIdx]?.operators.map((operator, i) => (
              <SelectItem value={i.toString()} key={i}>
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full max-w-[20rem]">
        <AdvancedFilterInput
          key={`${filter.filterMapIdx}-${filter.operatorIdx}`}
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
        {showAddFilter && showAddFilter === true && (
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAddFilter()}
                className="text-slate-500 h-8 w-8 hover:border hover:border-slate-200 hover:text-slate-500"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Filter</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteHandler}
              className="flex items-center text-slate-500 h-8 w-8"
            >
              <Trash2Icon className="h-5 w-5 text-red-700" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Filter</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
