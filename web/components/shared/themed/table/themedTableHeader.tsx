import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FilterASTButton from "@/filterAST/FilterASTButton";
import { UIFilterRowTree } from "@/services/lib/filters/types";
import { TimeFilter } from "@/types/timeFilter";
import {
  CircleStackIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Result } from "../../../../lib/result";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { SingleFilterDef } from "../../../../services/lib/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import useSearchParams from "../../utils/useSearchParams";
import ThemedTimeFilter from "../themedTimeFilter";
import { DragColumnItem } from "./columns/DragList";
import ViewColumns from "./columns/viewColumns";
import ExportButton from "./exportButton";
import { RequestViews } from "./RequestViews";
import ViewButton from "./viewButton";

interface ThemedTableHeaderProps<T> {
  rows?: T[];

  // define this if you want the advanced filters
  advancedFilters?: {
    filterMap: SingleFilterDef<any>[];
    filters: UIFilterRowTree;
    setAdvancedFilters: (filters: UIFilterRowTree) => void;
    searchPropertyFilters: (
      property: string,
      search: string
    ) => Promise<Result<void, string>>;
    show?: boolean;
  };
  columns: Column<T, unknown>[];

  // define this if you want the time filter
  timeFilter?: {
    currentTimeFilter: TimeFilter;
    defaultValue: "24h" | "7d" | "1m" | "3m" | "all";
    onTimeSelectHandler: (key: TimeInterval, value: string) => void;
  };

  // define this if you want a table and view toggle
  viewToggle?: {
    currentView: RequestViews;
    onViewChange: (value: RequestViews) => void;
  };
  onDataSet?: () => void;
  savedFilters?: {
    filters?: OrganizationFilter[];
    currentFilter?: string;
    onFilterChange?: (value: OrganizationFilter | null) => void;
    onSaveFilterCallback?: () => void;
    layoutPage: "dashboard" | "requests";
  };
  activeColumns: DragColumnItem[];
  setActiveColumns: (columns: DragColumnItem[]) => void;
  customButtons?: React.ReactNode[];
  isDatasetsPage?: boolean;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  selectedRows?: {
    count?: number;
    children?: React.ReactNode;
  };
  showFilters?: boolean;
}

export default function ThemedTableHeader<T>(props: ThemedTableHeaderProps<T>) {
  const {
    rows,
    columns,
    timeFilter,
    advancedFilters,
    viewToggle,
    savedFilters,
    activeColumns,
    setActiveColumns,
    customButtons,
    isDatasetsPage,
    search,
    selectedRows,
    showFilters: showFiltersProp,
  } = props;

  const searchParams = useSearchParams();

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const getDefaultValue = () => {
    const currentTimeFilter = searchParams.get("t");

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col">
        <div className="flex flex-col gap-3 lg:flex-row justify-between ">
          <div className="flex flex-row gap-3 items-center">
            {timeFilter !== undefined ? (
              <ThemedTimeFilter
                currentTimeFilter={timeFilter.currentTimeFilter}
                timeFilterOptions={[]}
                onSelect={function (key: string, value: string): void {
                  timeFilter.onTimeSelectHandler(key as TimeInterval, value);
                }}
                isFetching={false}
                defaultValue={getDefaultValue()}
                custom={true}
              />
            ) : (
              <div />
            )}
            <div className="flex flex-row">
              {(advancedFilters || showFiltersProp) && <FilterASTButton />}
            </div>
          </div>

          <div className="flex flex-wrap justify-start lg:justify-end items-center">
            {(selectedRows?.count ?? 0) > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <div className="flex flex-row gap-2 items-center">
                  <span className="text-sm p-2 rounded-md font-medium bg-[#F1F5F9] dark:bg-slate-900 text-[#1876D2] dark:text-slate-100 whitespace-nowrap">
                    {selectedRows!.count}{" "}
                    {selectedRows!.count === 1 ? "row" : "rows"} selected
                  </span>
                </div>
                {selectedRows!.children && selectedRows!.children}
              </div>
            )}

            {search && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex items-center">
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isSearchExpanded ? "w-40 sm:w-64" : "w-0"
                      }`}
                    >
                      <Input
                        ref={searchInputRef}
                        type="text"
                        value={search.value}
                        onChange={(e) => search.onChange(e.target.value)}
                        placeholder={search.placeholder}
                        className={clsx(
                          "w-40 sm:w-64 text-sm pr-8 transition-transform duration-300 ease-in-out outline-none border-none ring-0",
                          isSearchExpanded
                            ? "translate-x-0"
                            : "translate-x-full"
                        )}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={
                        isSearchExpanded
                          ? "absolute right-0 hover:bg-transparent"
                          : ""
                      }
                      onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                    >
                      {isSearchExpanded ? (
                        <XMarkIcon className="h-4 w-4" />
                      ) : (
                        <MagnifyingGlassIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isSearchExpanded ? "Close search" : "Open search"}
                </TooltipContent>
              </Tooltip>
            )}

            {columns && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ViewColumns
                      columns={columns}
                      activeColumns={activeColumns}
                      setActiveColumns={setActiveColumns}
                      isDatasetsPage={isDatasetsPage}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Manage columns</TooltipContent>
              </Tooltip>
            )}

            {rows && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ExportButton rows={rows} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Export data</TooltipContent>
              </Tooltip>
            )}

            {viewToggle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ViewButton
                      currentView={viewToggle.currentView}
                      onViewChange={(value: RequestViews) => {
                        viewToggle.onViewChange(value);
                      }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Toggle view</TooltipContent>
              </Tooltip>
            )}

            {advancedFilters && props.onDataSet && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (props.onDataSet) {
                    props.onDataSet();
                  }
                }}
                size="xs"
                className="flex items-center gap-2 text-slate-700 dark:text-slate-400"
              >
                <CircleStackIcon className="h-4 w-4" />
              </Button>
            )}

            {customButtons && customButtons.map((button) => button)}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
