import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { ArrowPathIcon, CircleStackIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { TextInput } from "@tremor/react";
import { useState } from "react";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
import { Database } from "../../../supabase/database.types";
import { useOrg } from "../../layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedModal from "../../shared/themed/themedModal";

interface CreateDataSetModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  filter: FilterNode;
  uiFilter: UIFilterRow[];
  filterMap: SingleFilterDef<any>[];
}
export const CreateDataSetModal = (props: CreateDataSetModalProps) => {
  const { open: isOpen, setOpen, filter, uiFilter, filterMap } = props;

  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient<Database>();
  const org = useOrg();

  const [datasetName, setDatasetName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ThemedModal open={isOpen} setOpen={setOpen}>
      <div className="flex flex-col gap-8 w-[450px]">
        <div className="flex flex-row items-center gap-2">
          <CircleStackIcon className="w-6 h-6" />
          <p className="font-semibold text-xl">Create Dataset</p>
        </div>
        <div className="flex flex-col space-y-1">
          <label
            htmlFor="alert-metric"
            className="text-gray-900 text-xs font-semibold"
          >
            Dataset Name
          </label>
          <TextInput
            placeholder="My shiny new data set"
            value={datasetName}
            onChange={(e) => {
              setDatasetName(e.target.value);
            }}
          />
        </div>
        <p className="text-gray-500 whitespace-pre-wrap text-sm">
          This will create a new dataset with the current filters applied. This
          will allow you to use this dataset to fine-tune a model.
        </p>
        <div className="flex flex-col space-y-4">
          <label
            htmlFor="alert-metric"
            className="text-gray-900 text-xs font-semibold"
          >
            Your Filters
          </label>
          <ul className="flex flex-col space-y-2">
            {uiFilter.length === 0 ? (
              <p className="text-sm">None</p>
            ) : (
              uiFilter.map((_filter, i) => (
                <li
                  className="flex flex-row text-sm space-x-1 items-center"
                  key={`filer_${i}`}
                >
                  <ArrowRightIcon className="w-3 h-3" />
                  <span className="font-semibold">
                    {filterMap[_filter.filterMapIdx]?.label}
                  </span>
                  <span>
                    {
                      filterMap[_filter.filterMapIdx]?.operators[
                        _filter.operatorIdx
                      ].label
                    }
                  </span>
                  <span>`{_filter.value}`</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="col-span-4 flex justify-end gap-2">
          <button
            onClick={() => {
              setOpen(false);
            }}
            type="button"
            className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            disabled={isLoading}
            onClick={async () => {
              if (!datasetName) {
                setNotification("Must provide a dataset name", "error");
              } else if (org?.currentOrg?.id) {
                setIsLoading(true);
                await supabaseClient
                  .from("finetune_dataset")
                  .insert([
                    {
                      name: datasetName,
                      organization_id: org?.currentOrg?.id,
                      filters: JSON.stringify(uiFilter),
                      filter_node: JSON.stringify(filter),
                    },
                  ])
                  .then((x) => {
                    if (x.error) {
                      setNotification(x.error.message, "error");
                      setOpen(false);
                    } else {
                      setNotification("Dataset Created!", "success");
                      setOpen(false);
                    }
                    setIsLoading(false);
                  });
              } else {
                setNotification("Must be in an org", "error");
              }
            }}
            className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isLoading && (
              <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
            )}
            Create Data Set
          </button>
        </div>
      </div>
    </ThemedModal>
  );
};
