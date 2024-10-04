import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { styled } from "@mui/material/styles";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import { Plus, Trash } from "lucide-react";
import { Result } from "../../../lib/result";
import {
  ColumnType,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../services/lib/organization_layout/organization_layout";
import FilterTreeEditor from "./FilterTreeEditor";
import ThemedNumberDropdown from "./themedNumberDropdown";
import { ThemedTextDropDown } from "./themedTextDropDown";

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
    <div className="w-full flex flex-col bg-white dark:bg-black p-4 rounded-sm border border-gray-300 dark:border-gray-700">
      <div className="w-full flex justify-end">
        <button
          onClick={() => {
            setAdvancedFilters({ operator: "and", rows: [] });
          }}
          className="text-xs text-gray-500 font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
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
  const BlackTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
      fontSize: "0.8rem",
    },
  }));
  return (
    <div className="w-full flex flex-col lg:grid lg:grid-cols-4 gap-3 items-left lg:items-end ml-4">
      <div className="w-full max-w-[12.5rem] text-xs">
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
      <div className="flex flex-row w-full justify-between pr-4 items-center">
        <div className="flex flex-row  justify-start items-center w-full pr-4 h-full">
          <div className="w-full lg:w-fit mr-4 pb-1">
            <Button
              variant="destructive"
              size="icon"
              onClick={onDeleteHandler}
              className="h-6 w-6 "
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
          {showAddFilter && showAddFilter === true && (
            <Button
              variant="outline"
              size="sm_sleek"
              onClick={() => onAddFilter()}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
