import {
  Card,
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useOrg } from "../../layout/organizationContext";
import { Database } from "../../../supabase/database.types";
import { getUSDate, getUSDateFromString } from "../../shared/utils/utils";
import { middleTruncString } from "../../../lib/stringHelpers";
import JobRow, { FineTuneJob } from "./jobRow";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedModal from "../../shared/themed/themedModal";
import FineTuneForm from "./fineTuneForm";
import { useJawn } from "../../../services/hooks/useJawn";
import LoadingAnimation from "../../shared/loadingAnimation";
import { clsx } from "../../shared/clsx";
import Link from "next/link";
import ModelPill from "../requestsV2/modelPill";
import useNotification from "../../shared/notification/useNotification";
import JobStatus from "./jobStatus";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { REQUEST_TABLE_FILTERS } from "../../../services/lib/filters/frontendFilterDefs";
import { DiffHighlight } from "../welcome/diffHighlight";
import { useRouter } from "next/router";
import AuthHeader from "../../shared/authHeader";

interface FineTuningPageProps {}

const FineTuningPage = (props: FineTuningPageProps) => {
  const {} = props;
  const { fetchJawn } = useJawn();
  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<FineTuneJob>();

  const supabaseClient = useSupabaseClient<Database>();
  const orgContext = useOrg();
  const router = useRouter();
  const { setNotification } = useNotification();

  const {
    data: jobs,
    isLoading: isJobsLoading,
    refetch,
  } = useQuery({
    queryKey: ["fine-tune-jobs", orgContext?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;

      const { data, error } = await supabaseClient
        .from("finetune_job")
        .select("*")
        .eq("organization_id", orgId);

      const sortedData = data?.sort((a, b) =>
        a.created_at > b.created_at ? -1 : 1
      );

      if (error || !sortedData) {
        console.error(error);
        return [];
      }
      return await Promise.all(
        sortedData.map(async (x) => ({
          ...x,
          dataFromOpenAI: await fetchJawn({
            path: `/v1/fine-tune/${x.id}/stats`,
            method: "GET",
          }).then((x) => x.json()),
        }))
      );
    },
    refetchOnWindowFocus: false,
    refetchInterval: 5_000,
  });

  const { data: datasets, isLoading: isDatasetsLoading } = useQuery({
    queryKey: ["fine-tune-datasets", orgContext?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const { data, error } = await supabaseClient
        .from("finetune_dataset")
        .select("*")
        .eq("organization_id", orgId);

      if (error || !data) {
        console.error(error);
        return [];
      }
      return data;
    },
    refetchOnWindowFocus: false,
  });

  const jobDataSet = datasets?.find(
    (dataset) => dataset.id === selectedJob?.dataset_id
  );

  const jobFilters = JSON.parse(jobDataSet?.filters || "{}") as UIFilterRow[];

  const filterMap = REQUEST_TABLE_FILTERS;

  return (
    <>
      <div className="flex flex-col space-y-4">
        <AuthHeader title={"Fine-Tune"} />

        <div className="flex flex-col">
          <div className="flex flex-row justify-between items-center mb-4">
            <div />
            <div className="flex flex-row space-x-2 items-center">
              <button
                onClick={() => {
                  setFineTuneOpen(true);
                }}
                className="items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <PlusIcon className="h-4 w-4" />
                Create New
              </button>
            </div>
          </div>
          <div className="flex flex-col w-full space-y-4">
            {isJobsLoading || isDatasetsLoading ? (
              <LoadingAnimation title="Loading Data..." />
            ) : jobs === undefined || jobs?.length === 0 ? (
              <div className="flex flex-col w-full h-96 justify-center items-center">
                <div className="flex flex-col w-2/5">
                  <SparklesIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                  <p className="text-xl text-black dark:text-white font-semibold mt-8">
                    No Fine-Tune Jobs
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mt-2">
                    Create a fine-tune job to get started.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setFineTuneOpen(true);
                      }}
                      className="items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Create
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="py-1 px-2">
                <Table className="overflow-auto">
                  <TableHead className="border-b border-gray-300 dark:border-gray-700">
                    <TableRow>
                      <TableHeaderCell className="text-black dark:text-white">
                        {/* the fine-tune job id  */}
                        Fine-Tuned Model
                      </TableHeaderCell>
                      <TableHeaderCell className="text-black dark:text-white">
                        Status
                      </TableHeaderCell>
                      <TableHeaderCell className="text-black dark:text-white">
                        Created At
                      </TableHeaderCell>
                      <TableHeaderCell className="text-black dark:text-white">
                        Data Set
                      </TableHeaderCell>
                      <TableHeaderCell className="text-black dark:text-white">
                        Base Model
                      </TableHeaderCell>
                      <TableHeaderCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobs?.map((job, index) => (
                      <JobRow
                        job={job}
                        key={index}
                        onSelect={(job) => {
                          setSelectedJob(job);
                          setJobOpen(true);
                        }}
                        datasets={datasets}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </div>
      </div>
      <ThemedModal open={fineTuneOpen} setOpen={setFineTuneOpen}>
        <FineTuneForm
          numberOfModels={jobs?.length || 0}
          onCancel={() => {
            setFineTuneOpen(false);
          }}
          onSuccess={() => {
            refetch();
            setFineTuneOpen(false);
          }}
        />
      </ThemedModal>
      <ThemedDrawer open={jobOpen} setOpen={setJobOpen}>
        <div className="flex flex-col py-2">
          {selectedJob?.dataFromOpenAI.job?.status === "succeeded" && (
            <>
              <p className="text-gray-500 text-sm">Model</p>
              <button
                onClick={() => {
                  if (selectedJob?.dataFromOpenAI.job?.fine_tuned_model) {
                    navigator.clipboard.writeText(
                      selectedJob?.dataFromOpenAI.job?.fine_tuned_model
                    );
                    setNotification("Copied to clipboard", "success");
                  }
                }}
                className="flex flex-row items-center"
              >
                <h3 className="text-xl font-semibold">
                  {selectedJob?.dataFromOpenAI.job?.fine_tuned_model || "n/a"}
                </h3>
                <ClipboardDocumentListIcon className="w-5 h-5 ml-2 text-gray-500" />
              </button>
            </>
          )}

          <ul
            className={clsx(
              "mt-4 grid grid-cols-1 gap-x-4 divide-y divide-gray-300 dark:divide-gray-700 justify-between text-sm w-full"
            )}
          >
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Status
              </p>
              <JobStatus
                jobStatus={
                  selectedJob?.dataFromOpenAI.job?.status ||
                  selectedJob?.status ||
                  "unknown"
                }
              />
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Job ID
              </p>
              <Link
                href={`https://platform.openai.com/finetune/${selectedJob?.finetune_job_id}?filter=all`}
                target="_blank"
                rel="noreferrer noopener"
                className="underline flex items-center"
              >
                <p className="text-gray-700 dark:text-gray-300 truncate">
                  {selectedJob?.finetune_job_id}
                </p>
                <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1 inline" />
              </Link>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Base Model
              </p>
              <ModelPill
                model={selectedJob?.dataFromOpenAI.job?.model || "unknown"}
              />
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Data Set
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(true);
                }}
                className="underline"
              >
                {middleTruncString(jobDataSet?.name || "", 16)}
              </button>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Created At
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">
                {getUSDate(new Date(selectedJob?.created_at || ""))}
              </p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Trained Tokens
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">
                {selectedJob?.dataFromOpenAI.job?.trained_tokens}
              </p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Epochs
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">
                {selectedJob?.dataFromOpenAI.job?.hyperparameters.n_epochs}
              </p>
            </li>
          </ul>
          {selectedJob?.dataFromOpenAI.job?.status === "succeeded" && (
            <div className="mt-8">
              <p className="font-semibold text-xl">How to integrate</p>
              <p className="text-gray-500 text-sm mt-1 leading-5">
                Replace the model name in your API call with the fine-tuned
                model name. The following snippet is an example for a request
                using Python.
              </p>
              <DiffHighlight
                code={`
import OpenAI

# client config
client = OpenAI(
  api_key="your-api-key-here",
  base_url="http://oai.hconeai.com/v1", 
  default_headers= {  
    "Helicone-Auth": f"Bearer {HELICONE_API_KEY}",
  }
)

# send the request
chat_completion = client.chat.completions.create(
  model="${selectedJob?.dataFromOpenAI.job?.fine_tuned_model}",
  messages=[
    {"role": "user", "content": "Hello world!"}
  ],
  extra_headers={ # Can also attach headers per request
    "Helicone-Auth": f"Bearer {HELICONE_API_KEY}",
  },
)
            `}
                language="bash"
                newLines={[13]}
                oldLines={[]}
                minHeight={false}
                textSize="sm"
              />
            </div>
          )}
        </div>
      </ThemedDrawer>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col gap-4 w-[450px]">
          <div className="flex flex-row items-center gap-2">
            <CircleStackIcon className="w-6 h-6" />
            <p className="font-semibold text-xl">Dataset</p>
          </div>
          <ul className="flex flex-col space-y-1">
            <li className="flex flex-row text-sm space-x-1 items-center">
              <span className="font-semibold">Name:</span>
              <span>{jobDataSet?.name}</span>
            </li>
            <li className="flex flex-row text-sm space-x-1 items-center">
              <span className="font-semibold">Id:</span>
              <span>{jobDataSet?.id}</span>
            </li>
            <li className="flex flex-row text-sm space-x-1 items-center">
              <span className="font-semibold">Created At:</span>
              <span>{getUSDateFromString(jobDataSet?.created_at || "")}</span>
            </li>
            <li className="flex flex-col text-sm pt-4 space-y-1">
              <span className="font-semibold">Filters:</span>
              <ul className="flex flex-col space-y-2">
                {!jobFilters ||
                jobFilters.length === 0 ||
                !Array.isArray(jobFilters) ? (
                  <p className="text-sm">None</p>
                ) : (
                  jobFilters.map((_filter, i) => (
                    <li
                      className="flex flex-row text-sm space-x-1 items-center"
                      key={`_filter_${i}`}
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
            </li>
          </ul>
        </div>
      </ThemedModal>
    </>
  );
};

export default FineTuningPage;
