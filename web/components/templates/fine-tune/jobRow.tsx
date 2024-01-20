import { TableCell, TableRow } from "@tremor/react";
import { getUSDateFromString } from "../../shared/utils/utils";
import { middleTruncString } from "../../../lib/stringHelpers";
import {
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
} from "@heroicons/react/20/solid";
import { Database } from "../../../supabase/database.types";
import {
  FineTuningJob,
  FineTuningJobEventsPage,
} from "openai/resources/fine-tuning/jobs";

type FineTuneJob = Database["public"]["Tables"]["finetune_job"]["Row"] & {
  dataFromOpenAI: {
    job: FineTuningJob;
    events: FineTuningJobEventsPage;
  };
};

interface JobRowProps {
  job: FineTuneJob;
  onSelect: (job: FineTuneJob) => void;
}

const JobRow = (props: JobRowProps) => {
  const { job, onSelect } = props;

  return (
    <>
      <TableRow
        onClick={() => onSelect(job)}
        className="text-black dark:text-white border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 hover:cursor-pointer"
      >
        <>
          <TableCell className="">{job.finetune_job_id}</TableCell>
          <TableCell className="">{job.status}</TableCell>
          <TableCell className="">
            {getUSDateFromString(job.created_at)}
          </TableCell>
          <TableCell className="">
            {middleTruncString(job.dataset_id, 8)}
          </TableCell>
          <TableCell className="">TBD</TableCell>
          <TableCell className="">TBD</TableCell>
          <TableCell>
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </TableCell>
        </>
      </TableRow>
    </>
  );
};

export default JobRow;
