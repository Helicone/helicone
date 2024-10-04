import { CircleStackIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import { useEffect, useState, useRef } from "react";
import { Result } from "../../../../lib/result";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { SingleFilterDef } from "../../../../services/lib/filters/frontendFilterDefs";
import { AdvancedFilters } from "../themedAdvancedFilters";
import ThemedTimeFilter from "../themedTimeFilter";
import ExportButton from "./exportButton";
import ViewColumns from "./columns/viewColumns";
import useSearchParams from "../../utils/useSearchParams";
import { TimeFilter } from "../../../templates/dashboard/dashboardPage";
import ViewButton from "./viewButton";
import { RequestViews } from "./themedTable";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import FiltersButton from "./filtersButton";
import { DragColumnItem } from "./columns/DragList";
import { UIFilterRowTree } from "../../../../services/lib/filters/uiFilterRowTree";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PinIcon } from "lucide-react";

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
  } = props;

  const searchParams = useSearchParams();

  const [showFilters, setShowFilters] = useState(false);

  // Add state variables to manage the popover's open state and pin status
  const [isFiltersPopoverOpen, setIsFiltersPopoverOpen] = useState(false);
  const [isFiltersPinned, setIsFiltersPinned] = useState(false);
  const popoverContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const displayFilters = window.sessionStorage.getItem("showFilters") || null;
    setShowFilters(displayFilters ? JSON.parse(displayFilters) : false);
  }, []);

  const showFilterHandler = () => {
    setShowFilters(!showFilters);
    window.sessionStorage.setItem("showFilters", JSON.stringify(!showFilters));
  };

  const getDefaultValue = () => {
    const currentTimeFilter = searchParams.get("t");

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  const handlePopoverInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
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
            {advancedFilters && (
              <Popover open={isFiltersPopoverOpen} onOpenChange={() => {}}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghostLinear"
                    className="gap-2"
                    size="sm_sleek"
                    onClick={() => {
                      if (isFiltersPinned) {
                        setShowFilters(!showFilters);
                      } else {
                        setIsFiltersPopoverOpen(!isFiltersPopoverOpen);
                      }
                    }}
                  >
                    <FunnelIcon className="h-[13px] w-[13px]" />
                    <span className="hidden sm:inline font-normal text-[13px]">
                      {isFiltersPinned
                        ? showFilters
                          ? "Hide Filters"
                          : "Show Filters"
                        : "Filters"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="min-w-[50rem] w-[50vw] flex items-start"
                  ref={popoverContentRef}
                  onInteractOutside={(e) => {}}
                  onClick={handlePopoverInteraction}
                >
                  <AdvancedFilters
                    filterMap={advancedFilters.filterMap}
                    filters={advancedFilters.filters}
                    setAdvancedFilters={advancedFilters.setAdvancedFilters}
                    searchPropertyFilters={
                      advancedFilters.searchPropertyFilters
                    }
                    savedFilters={savedFilters?.filters}
                    onSaveFilterCallback={savedFilters?.onSaveFilterCallback}
                    layoutPage={savedFilters?.layoutPage ?? "requests"}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="ghostLinear"
                      onClick={() => {
                        setIsFiltersPinned(!isFiltersPinned);
                        setIsFiltersPopoverOpen(false);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isFiltersPinned ? (
                        <PinIcon className="h-5 w-5 text-primary" />
                      ) : (
                        <PinIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {savedFilters && (
              <FiltersButton
                filters={savedFilters.filters}
                currentFilter={savedFilters.currentFilter}
                onFilterChange={savedFilters.onFilterChange}
                onDeleteCallback={() => {
                  if (savedFilters.onSaveFilterCallback) {
                    savedFilters.onSaveFilterCallback();
                  }
                }}
                layoutPage={savedFilters.layoutPage}
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-start lg:justify-end">
          {columns && (
            <ViewColumns
              columns={columns}
              activeColumns={activeColumns}
              setActiveColumns={setActiveColumns}
              isDatasetsPage={isDatasetsPage}
            />
          )}

          {rows && <ExportButton rows={rows} />}

          {viewToggle && (
            <ViewButton
              currentView={viewToggle.currentView}
              onViewChange={(value: RequestViews) => {
                viewToggle.onViewChange(value);
              }}
            />
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
              className="flex items-center gap-2"
            >
              <CircleStackIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Create Dataset</span>
            </Button>
          )}
          {customButtons && customButtons.map((button) => button)}
        </div>
      </div>

      {advancedFilters && showFilters && isFiltersPinned && (
        <div className="flex justify-start min-w-[50rem] w-full">
          <div>
            <AdvancedFilters
              filterMap={advancedFilters.filterMap}
              filters={advancedFilters.filters}
              setAdvancedFilters={advancedFilters.setAdvancedFilters}
              searchPropertyFilters={advancedFilters.searchPropertyFilters}
              savedFilters={savedFilters?.filters}
              onSaveFilterCallback={savedFilters?.onSaveFilterCallback}
              layoutPage={savedFilters?.layoutPage ?? "requests"}
            />
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsFiltersPinned(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <PinIcon className="h-5 w-5 text-primary rotate-45 fill-gray-500" />
          </Button>
        </div>
      )}
    </div>
  );
}
