import { UIFilterRow } from "@/services/lib/filters/types";
import { Result } from "../../../lib/result";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
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
    <div className="w-full flex flex-col bg-white p-4 dark:bg-black rounded-lg">
      <div className="w-full flex items-center justify-between mb-3">
        <h3 className="text-xs text-slate-900 dark:text-slate-100 font-semibold">
          Filters
        </h3>
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
