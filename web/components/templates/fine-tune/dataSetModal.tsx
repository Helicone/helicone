import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { useJawn } from "../../../services/hooks/useJawn";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { Database } from "../../../supabase/database.types";
import { useOrg } from "../../layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedDrawer from "../../shared/themed/themedDrawer";

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
    <ThemedDrawer open={isOpen} setOpen={setOpen}>
      <div className="flex flex-col gap-4 w-full">
        <p className="font-semibold text-lg">Create Dataset</p>
        This will fine tune your request with a limit of 1,000 rows using your
        openAPI key.
        <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
          {/* Organization {` "${orgName}" `} will be deleted from your account. */}
        </p>
        <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
          This will create a fine-tuned model on your account and you will be
          charged. Are you sure you want to continue?
        </p>
        <input
          type="text"
          placeholder="dataset name"
          className="border border-gray-300 dark:border-gray-700 rounded-md p-2"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
        />
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
    </ThemedDrawer>
  );
};
