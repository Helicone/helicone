import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { useJawn } from "../../../services/hooks/useJawn";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { Database } from "../../../supabase/database.types";
import { useOrg } from "../../layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedModal from "../../shared/themed/themedModal";
import { CircleStackIcon } from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";

interface CreateDataSetModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  filter: FilterNode;
  uiFilter: UIFilterRow[];
}
export const CreateDataSetModal = (props: CreateDataSetModalProps) => {
  const { open: isOpen, setOpen, filter, uiFilter } = props;

  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient<Database>();
  const org = useOrg();
  const [error, setError] = useState("");

  const [datasetName, setDatasetName] = useState("");
  const [loading, setLoading] = useState(false);

  const [accepted, setAccepted] = useState(false);
  const { fetchJawn } = useJawn();

  return (
    <ThemedModal open={isOpen} setOpen={setOpen}>
      <div className="flex flex-col gap-4 w-[450px]">
        <div className="flex flex-row items-center gap-2">
          <CircleStackIcon className="w-6 h-6" />
          <p className="font-semibold text-xl">Create Dataset</p>
        </div>
        <p className="text-gray-500 whitespace-pre-wrap text-sm">
          This will create a new dataset with the current filters applied. This
          will allow you to use this dataset to fine-tune a model.
        </p>
        <div className="flex flex-col space-y-1">
          <label
            htmlFor="alert-metric"
            className="text-gray-900 text-xs font-semibold"
          >
            Data Set Name
          </label>
          <TextInput
            placeholder="My shiny new data set"
            value={datasetName}
            onChange={(e) => {
              setDatasetName(e.target.value);
            }}
          />
        </div>

        <button
          onClick={() => {
            if (org?.currentOrg?.id) {
              supabaseClient
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
                    setError(x.error.message);
                  } else {
                    setNotification("Dataset Created!", "success");
                    setOpen(false);
                  }
                });
            } else {
              setNotification("must be in an org", "error");
            }
          }}
          className=" text-center items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Create Dataset
        </button>
        {error && <div className="text-red-500">{error}</div>}
        {loading && <div className="animate-pulse">...loading</div>}
      </div>
    </ThemedModal>
  );
};
