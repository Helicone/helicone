import { TableCell, TableRow } from "@tremor/react";
import { getUSDate, getUSDateFromString } from "../../shared/utils/utils";
import { middleTruncString } from "../../../lib/stringHelpers";
import {
  ArrowRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import { Database } from "../../../supabase/database.types";
import {
  FineTuningJob,
  FineTuningJobEventsPage,
} from "openai/resources/fine-tuning/jobs";
import ThemedModal from "../../shared/themed/themedModal";
import { useState } from "react";
import { CircleStackIcon } from "@heroicons/react/24/outline";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { REQUEST_TABLE_FILTERS } from "../../../services/lib/filters/frontendFilterDefs";
import ModelPill from "../requestsV2/modelPill";
import useNotification from "../../shared/notification/useNotification";
import { Tooltip } from "@mui/material";
import JobStatus from "./jobStatus";

export type FineTuneJob =
  Database["public"]["Tables"]["finetune_job"]["Row"] & {
    dataFromOpenAI: {
      job: FineTuningJob;
      events: FineTuningJobEventsPage;
    };
  };

interface JobRowProps {
  job: FineTuneJob;
  onSelect: (job: FineTuneJob) => void;
  datasets?: Database["public"]["Tables"]["finetune_dataset"]["Row"][];
}

const JobRow = (props: JobRowProps) => {
  const { job, onSelect, datasets } = props;

  const jobDataSet = datasets?.find((dataset) => dataset.id === job.dataset_id);

  const [open, setOpen] = useState(false);

  const jobFilters = JSON.parse(jobDataSet?.filters || "") as UIFilterRow[];

  const filterMap = REQUEST_TABLE_FILTERS;

  const { setNotification } = useNotification();

  return (
    <>
      <TableRow
        onClick={() => onSelect(job)}
        className="text-black dark:text-white border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 hover:cursor-pointer"
      >
        <>
          <TableCell>
            <Tooltip title="Copy" placement="top">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (job.dataFromOpenAI.job?.fine_tuned_model) {
                    navigator.clipboard.writeText(
                      job.dataFromOpenAI.job?.fine_tuned_model
                    );
                    setNotification("Copied to clipboard", "success");
                  }
                }}
                className="flex items-center font-semibold underline"
              >
                {job.dataFromOpenAI.job?.fine_tuned_model || "n/a"}
              </button>
            </Tooltip>
          </TableCell>
          <TableCell>
            <JobStatus
              jobStatus={job.dataFromOpenAI.job?.status || job.status}
            />
          </TableCell>
          <TableCell>{getUSDate(new Date(job.created_at))}</TableCell>
          <TableCell>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
              className="underline"
            >
              {middleTruncString(jobDataSet?.name || "", 16)}
            </button>
          </TableCell>
          <TableCell>
            <ModelPill
              model={job.dataFromOpenAI.job?.model || "gpt-3.5-turbo-1106"}
            />
          </TableCell>

          <TableCell>
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </TableCell>
        </>
      </TableRow>
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
                      key={`job_row_filter_${i}`}
                    >
                      <ArrowRightIcon className="w-3 h-3" />
                      <span className="font-semibold">
                        {filterMap[_filter.filterMapIdx]?.label}
                      </span>
                      <span>
                        {
                          filterMap[_filter.filterMapIdx]?.operators[
                            _filter.operatorIdx
                          ]?.label
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

export default JobRow;
