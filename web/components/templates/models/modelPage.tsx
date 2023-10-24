import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { ModelMetric } from "../../../lib/api/models/models";
import { Result } from "../../../lib/result";
import { Database } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedTable from "../../shared/themed/themedTable";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useState } from "react";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { INITIAL_COLUMNS } from "./initialColumns";
import ThemedModal from "../../shared/themed/themedModal";
import {
  ClipboardDocumentIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/outline";
import { Dialog } from "@headlessui/react";
import useNotification from "../../shared/notification/useNotification";
import useSearchParams from "../../shared/utils/useSearchParams";

interface ModelPageProps {}

const ModelPage = (props: ModelPageProps) => {
  const searchParams = useSearchParams();

  const getInterval = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  const [interval, setInterval] = useState<TimeInterval>(
    getInterval() as TimeInterval
  );

  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo(interval),
    end: new Date(),
  });
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelMetric>();
  const { setNotification } = useNotification();

  const { data, isLoading } = useQuery({
    queryKey: ["modelMetrics", timeFilter],
    queryFn: async (query) => {
      return await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: "all",
          offset: 0,
          limit: 100,
          timeFilter,
        }),
      }).then((res) => res.json() as Promise<Result<ModelMetric[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <AuthHeader title={"Models"} />
      <ThemedTableV5
        defaultData={data?.data || []}
        defaultColumns={INITIAL_COLUMNS}
        tableKey={"modelMetrics"}
        dataLoading={isLoading}
        exportData={data?.data || []}
        onRowSelect={(row) => {
          setOpen(true);
          setSelectedModel(row);
        }}
        timeFilter={{
          currentTimeFilter: timeFilter,
          defaultValue: "all",
          onTimeSelectHandler: (key: TimeInterval, value: string) => {
            if ((key as string) === "custom") {
              const [startDate, endDate] = value.split("_");

              const start = new Date(startDate);
              const end = new Date(endDate);
              setInterval(key);
              setTimeFilter({
                start,
                end,
              });
            } else {
              setInterval(key);
              setTimeFilter({
                start: getTimeIntervalAgo(key),
                end: new Date(),
              });
            }
          },
        }}
      />
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-full min-w-[300px] flex flex-col">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
            <CubeTransparentIcon
              className="h-8 w-8 text-sky-600"
              aria-hidden="true"
            />
          </div>

          <div className="mt-3 text-center sm:mt-5">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900"
            >
              Model Information
            </Dialog.Title>
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex w-full justify-center text-base font-medium text-gray-500 sm:text-sm items-center"
              onClick={() => {
                setNotification("Copied to clipboard", "success");
                navigator.clipboard.writeText(JSON.stringify(selectedModel));
              }}
            >
              Copy to clipboard
              <ClipboardDocumentIcon className="h-5 w-5 ml-1" />
            </button>
            <ul className="mt-4 space-y-2">
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Model:</p>
                <p>{selectedModel?.model}</p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Total Requests:</p>
                <p className="max-w-xl whitespace-pre-wrap text-left">
                  {selectedModel?.total_requests}
                </p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Total Tokens</p>
                <p className="max-w-xl whitespace-pre-wrap text-left">
                  {selectedModel?.total_tokens}
                </p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Total Completion Tokens</p>
                <p>{selectedModel?.total_completion_tokens}</p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Total Prompt Tokens</p>
                <p>{selectedModel?.total_prompt_token}</p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Total Cost:</p>
                <p> {selectedModel?.cost}</p>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 w-full justify-between gap-4 flex flex-row">
          <button
            type="button"
            tabIndex={-1}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:text-sm"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      </ThemedModal>
    </>
  );
};

export default ModelPage;
