import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Divider, Select, SelectItem } from "@tremor/react";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../layout/organizationContext";
import { PlusCircleIcon, PlusIcon } from "@heroicons/react/20/solid";
import { Tooltip } from "@mui/material";
import {
  ArrowPathIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import ProviderKeyList from "../enterprise/portal/id/providerKeyList";
import useNotification from "../../shared/notification/useNotification";
import Link from "next/link";
import { useJawn } from "../../../services/hooks/useJawn";

interface FineTurnFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const FineTurnForm = (props: FineTurnFormProps) => {
  const { onCancel, onSuccess } = props;

  const supabaseClient = useSupabaseClient<Database>();
  const orgContext = useOrg();
  const { setNotification } = useNotification();
  const { fetchJawn } = useJawn();

  const [selectAllRequests, setSelectAllRequests] = useState(false);
  const [selectedDataSetId, setSelectedDataSetId] = useState<string>();
  const [step, setStep] = useState<"config" | "confirm">("config");
  const [providerKeyId, setProviderKeyId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data, isLoading: isDataLoading } = useQuery({
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

  const onConfigSubmitHandler = () => {
    // do the fine tune stuff here
    if (!providerKeyId) {
      setNotification("Please select a provider key", "error");
      return;
    }
    if (selectAllRequests) {
      // alert("all selected");
      setStep("confirm");
      return;
    }
    if (!selectedDataSetId) {
      setNotification("Please select a data set", "error");
      return;
    }
    setStep("confirm");
  };

  const onConfirmSubmitHandler = () => {
    setIsLoading(true);
    fetchJawn({
      path: "/v1/fine-tune",
      body: JSON.stringify({
        filter: "all", // "all"
        providerKeyId,
        uiFilter: [], // []
      }),
      method: "POST",
    })
      .then((res) => {
        setIsLoading(false);
        if (res.ok) {
          setNotification("Fine-tuning job successfully started!", "success");
          onSuccess();
        } else {
          setNotification(
            "Please try again or contact help@helicone.ai",
            "error"
          );
          onCancel();
        }
      })
      .catch((res: any) => {
        onCancel();
        setNotification("error see console", "error");
      });
  };

  const stepArray = {
    config: (
      <>
        <div className="flex flex-col space-y-1">
          <label
            htmlFor="alert-metric"
            className="text-gray-900 text-xs font-semibold"
          >
            Base Model
          </label>
          <Select value="gpt-3.5-turbo-1106" enableClear={false}>
            <SelectItem value="gpt-3.5-turbo-1106">
              gpt-3.5-turbo-1106
            </SelectItem>
          </Select>
        </div>
        <ProviderKeyList
          orgId={orgContext?.currentOrg?.id}
          setProviderKeyCallback={(x) => {
            setProviderKeyId(x);
          }}
          variant="basic"
        />
        <div className="flex flex-col space-y-1.5">
          <div className="flex flex-row space-x-1 items-center">
            <label
              htmlFor="alert-metric"
              className="text-gray-900 text-xs font-semibold"
            >
              Data Sets
            </label>
            <Tooltip title="Add a new data set" placement="top">
              <button
                onClick={() => {
                  // setFineTuneOpen(true);
                }}
                className="items-center rounded-lg text-xs flex font-medium text-gray-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <PlusCircleIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          {data && data.length > 0 ? (
            <Select
              onValueChange={(value) => setSelectedDataSetId(value)}
              value={selectedDataSetId}
              enableClear={false}
            >
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
                  <CircleStackIcon className="h-6 w-6 mx-auto text-gray-900" />
                </div>
                <span className="mt-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Click here to generate a new data set
                </span>
              </button>
            </>
          )}
          <Divider className="text-xs py-2">Or</Divider>
          <fieldset>
            <legend className="sr-only">Notifications</legend>
            <div className="space-y-5">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id="comments"
                    aria-describedby="comments-description"
                    name="comments"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    onChange={(e) => {
                      setSelectedDataSetId("");
                      setSelectAllRequests(e.currentTarget.checked);
                    }}
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label
                    htmlFor="comments"
                    className="font-medium text-gray-900"
                  >
                    Select All Requests
                  </label>{" "}
                  <span id="comments-description" className="text-gray-500">
                    Up to 100
                  </span>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </>
    ),
    confirm: (
      <div className="flex flex-row w-full gap-4">
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
        <div className="flex flex-col space-y-4 w-full">
          <div className="text-sm">
            I understand that this fine-tuning job will be run using my OpenAI
            API key. To learn more about fine-tuning and pricing, please see{" "}
            <Link
              className="text-blue-500 underline"
              href="https://platform.openai.com/docs/guides/fine-tuning"
            >
              OpenAI&apos;s fine-tuning documentation
            </Link>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="w-full sm:w-[450px] h-full flex flex-col space-y-8">
      <h3 className="text-xl font-semibold text-black dark:text-white">
        Create a fine-tuned model
      </h3>
      {stepArray[step]}
      <div className="col-span-4 flex justify-end gap-2">
        <button
          onClick={
            step === "config"
              ? () => {
                  onCancel();
                }
              : () => {
                  setStep("config");
                }
          }
          type="button"
          className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          {step === "config" ? "Cancel" : "Back"}
        </button>
        <button
          disabled={isLoading}
          onClick={
            step === "config" ? onConfigSubmitHandler : onConfirmSubmitHandler
          }
          className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {isLoading && (
            <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
          )}
          {step === "config" ? "Create" : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default FineTurnForm;
