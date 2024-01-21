import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface JobStatusProps {
  jobStatus: string;
}

const JobStatus = (props: JobStatusProps) => {
  const { jobStatus } = props;

  switch (jobStatus) {
    case "succeeded":
      return (
        <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900 px-2 py-1 -my-1 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
          Success
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900 px-2 py-1 -my-1 text-xs font-medium text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-600/20">
          Cancelled
        </span>
      );
    case "validating_files":
      return (
        <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-900 px-2 py-1 -my-1 text-xs font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-600/20">
          <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
          Validating
        </span>
      );
    case "running":
      return (
        <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-900 px-2 py-1 -my-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 ring-1 ring-inset ring-yellow-600/20">
          <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
          Running
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-red-900 px-2 py-1 -my-1 text-xs font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-600/20">
          {jobStatus}
        </span>
      );
  }
};

export default JobStatus;
