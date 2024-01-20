import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Divider, Select, SelectItem } from "@tremor/react";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../layout/organizationContext";
import { PlusCircleIcon, PlusIcon } from "@heroicons/react/20/solid";
import { Tooltip } from "@mui/material";
import { CircleStackIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";

interface FineTurnFormProps {
  onCancel: () => void;
}

const FineTurnForm = (props: FineTurnFormProps) => {
  const { onCancel } = props;

  const [step, setStep] = useState(0);

  const supabaseClient = useSupabaseClient<Database>();
  const orgContext = useOrg();
  const [selectAllRequests, setSelectAllRequests] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["fine-tune-data-sets", orgContext?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const { data, error } = await supabaseClient
        .from("finetune_dataset")
        .select("*")
        .eq("organization_id", orgId);

      if (error) {
        console.error(error);
        return [];
      }
      return data;
    },
    refetchOnWindowFocus: false,
  });

  return (
    <form className="w-[450px] h-full flex flex-col space-y-8">
      <h3 className="text-xl font-semibold text-black dark:text-white">
        Create a fine-tuned model
      </h3>
      <div className="flex flex-col space-y-1">
        <label
          htmlFor="alert-metric"
          className="text-gray-500 text-xs font-semibold"
        >
          Base Model
        </label>
        <Select value="gpt-3.5-turbo-1106" enableClear={false}>
          <SelectItem value="gpt-3.5-turbo-1106">gpt-3.5-turbo-1106</SelectItem>
        </Select>
      </div>
      <div className="flex flex-col space-y-1.5">
        <div className="flex flex-row space-x-1 items-center">
          <label
            htmlFor="alert-metric"
            className="text-gray-500 text-xs font-semibold"
          >
            Data Sets
          </label>
          <Tooltip title="Add a new data set" placement="top">
            <button
              onClick={() => {
                // setFineTuneOpen(true);
              }}
              className="items-center rounded-lg text-xs flex font-medium text-gray-500 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <PlusCircleIcon className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        {data && data.length > 0 ? (
          <Select value="gpt-3.5-turbo-1106" enableClear={false}>
            {data.map((set) => (
              <SelectItem key={set.id} value={set.id}>
                {set.name}
              </SelectItem>
            ))}
          </Select>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectAllRequests(false);
              }}
              type="button"
              className="relative block w-full rounded-lg border bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 hover:cursor-pointer border-gray-300 dark:border-gray-700 p-8 text-center"
            >
              <div className="w-full justify-center align-middle items-center">
                <CircleStackIcon className="h-6 w-6 mx-auto text-gray-500" />
              </div>
              <span className="mt-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Click here to generate a new data set
              </span>
            </button>
          </>
        )}
        <Divider className="text-xs py-2">Or</Divider>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectAllRequests(!selectAllRequests);
          }}
          type="button"
          className={clsx(
            selectAllRequests
              ? "ring-1 ring-gray-700 bg-gray-300"
              : "bg-gray-50 hover:bg-gray-100",
            "relative block w-full rounded-lg border dark:bg-gray-950 dark:hover:bg-gray-900 hover:cursor-pointer border-gray-300 dark:border-gray-700 p-8 text-center"
          )}
        >
          <div className="w-full justify-center align-middle items-center">
            <CircleStackIcon className="h-6 w-6 mx-auto text-gray-700" />
          </div>
          <span className="mt-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Select All Requests (up to 100)
          </span>
        </button>
      </div>
      <div className="col-span-4 flex justify-end gap-2">
        <button
          onClick={onCancel}
          type="button"
          className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Create
        </button>
      </div>
    </form>
  );
};

export default FineTurnForm;
