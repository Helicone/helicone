import { useState } from "react";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { v4 as uuidv4 } from "uuid";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../services/lib/organization_layout/organization_layout";
import { useOrg } from "../../layout/organizationContext";
import { FunnelIcon } from "@heroicons/react/24/solid";
import useSearchParams from "../../shared/utils/useSearchParams";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import {
  UIFilterRowTree,
  isFilterRowNode,
} from "../../../services/lib/filters/uiFilterRowTree";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SaveFilterButtonProps {
  filters: UIFilterRowTree;
  onSaveFilterCallback: () => void;
  filterMap: SingleFilterDef<any>[];
  savedFilters?: OrganizationFilter[];
  layoutPage: "dashboard" | "requests";
}

const SaveFilterButton = (props: SaveFilterButtonProps) => {
  const jawn = useJawnClient();
  const { filters, onSaveFilterCallback, filterMap, savedFilters, layoutPage } =
    props;

  const { setNotification } = useNotification();
  const orgContext = useOrg();
  const searchParams = useSearchParams();

  const [isSaveFiltersModalOpen, setIsSaveFiltersModalOpen] = useState(false);
  const [filterName, setFilterName] = useState("");

  const encodeFilters = (filters: UIFilterRowTree): string => {
    const encode = (node: UIFilterRowTree): any => {
      if (isFilterRowNode(node)) {
        return {
          type: "node",
          operator: node.operator,
          rows: node.rows.map(encode),
        };
      } else {
        return {
          type: "leaf",
          filter: `${filterMap[node.filterMapIdx].label}:${
            filterMap[node.filterMapIdx].operators[node.operatorIdx].label
          }:${encodeURIComponent(node.value)}`,
        };
      }
    };

    return JSON.stringify(encode(filters));
  };

  const onSaveFilter = async (name: string) => {
    if (filters) {
      const saveFilter: OrganizationFilter = {
        id: uuidv4(),
        name: name,
        filter: [filters],
        createdAt: new Date().toISOString(),
        softDelete: false,
      };
      if (savedFilters !== undefined) {
        const updatedFilters = [...savedFilters, saveFilter];
        const { data, error } = await jawn.POST(
          "/v1/organization/{organizationId}/update_filter",
          {
            params: {
              path: {
                organizationId: orgContext?.currentOrg?.id!,
              },
            },
            body: {
              filterType: layoutPage,
              filters: updatedFilters,
            },
          }
        );
        if (error) {
          setNotification(error, "error");
          return;
        }
        setNotification("Filter created successfully", "success");
        setIsSaveFiltersModalOpen(false);
        onSaveFilterCallback();
        const currentAdvancedFilters = encodeFilters(filters);

        searchParams.set("filters", currentAdvancedFilters);
      } else {
        const { error: createFilterError } = await jawn.POST(
          "/v1/organization/{organizationId}/create_filter",
          {
            params: {
              path: {
                organizationId: orgContext?.currentOrg?.id!,
              },
            },
            body: {
              filters: [saveFilter],
              filterType: layoutPage,
            },
          }
        );
        if (createFilterError) {
          setNotification("Error creating filter", "error");
        } else {
          setNotification("Filter created successfully", "success");
          setIsSaveFiltersModalOpen(false);
          onSaveFilterCallback();
          const currentAdvancedFilters = encodeFilters(filters);
          searchParams.set("filters", currentAdvancedFilters);
        }
      }
    }
  };

  const renderFilterTree = (filterTree: UIFilterRowTree) => {
    if (isFilterRowNode(filterTree)) {
      return (
        <ul>
          {filterTree.rows.map((row, index) => (
            <li key={index}>
              {isFilterRowNode(row)
                ? renderFilterTree(row)
                : renderFilterRow(row)}
            </li>
          ))}
        </ul>
      );
    } else {
      return renderFilterRow(filterTree);
    }
  };

  const renderFilterRow = (filter: UIFilterRow) => (
    <div className="flex flex-row gap-2 items-center">
      <FunnelIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {filterMap[filter.filterMapIdx].label}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filterMap[filter.filterMapIdx].operators[filter.operatorIdx].label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {filter.value}
      </p>
    </div>
  );

  return (
    <>
      <Button
        onClick={() => {
          setIsSaveFiltersModalOpen(true);
        }}
        className={clsx("flex flex-row items-center gap-2")}
        size="md_sleek"
        variant="ghost"
      >
        <SaveIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block text-xs">
          Save as...
        </p>
      </Button>
      <ThemedModal
        open={isSaveFiltersModalOpen}
        setOpen={() => setIsSaveFiltersModalOpen(false)}
      >
        <div className="flex flex-col gap-8 inset-0 bg-opacity-50 w-full sm:w-[450px] max-w-[450px] h-full rounded-3xl">
          <h1 className="col-span-4 font-semibold text-xl text-gray-900 dark:text-gray-100">
            Save Filter
          </h1>

          <div className="flex flex-col space-y-2">
            <label
              htmlFor="alert-metric"
              className="text-gray-900 dark:text-gray-100 text-xs font-semibold"
            >
              Filter Name
            </label>
            <Input
              placeholder="My new filter"
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
              }}
            />
          </div>
          {renderFilterTree(filters)}
          <div className="col-span-4 flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsSaveFiltersModalOpen(false)}
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveFilter(filterName);
              }}
              className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Create New Filter
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default SaveFilterButton;
