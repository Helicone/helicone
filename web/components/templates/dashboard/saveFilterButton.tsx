import { useState } from "react";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { TextInput } from "@tremor/react";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
import { FunnelIcon } from "@heroicons/react/24/outline";

interface SaveFilterButtonProps {
  filters: UIFilterRow[];
  onSaveFilter: (filterName: string) => void;
  filterMap: SingleFilterDef<any>[];
}

const SaveFilterButton = (props: SaveFilterButtonProps) => {
  const { filters, onSaveFilter, filterMap } = props;

  const { setNotification } = useNotification();

  const [isSaveFiltersModalOpen, setIsSaveFiltersModalOpen] = useState(false);
  const [filterName, setFilterName] = useState("");

  return (
    <>
      <button
        onClick={() => {
          if (filters.length === 0) {
            setNotification("Saved Filters can not be empty", "error");
            return;
          }
          setIsSaveFiltersModalOpen(true);
        }}
        className={clsx(
          "bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
        )}
      >
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
          Create New Filter
        </p>
      </button>
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
            <TextInput
              placeholder="My new filter"
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
              }}
            />
          </div>
          <ul>
            {filters.map((filter, index) => {
              return (
                <li key={index}>
                  <div className="flex flex-row gap-2 items-center">
                    <FunnelIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {filterMap[filter.filterMapIdx].label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {
                        filterMap[filter.filterMapIdx].operators[
                          filter.operatorIdx
                        ].label
                      }
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {filter.value}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
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
              Save Filter
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default SaveFilterButton;
