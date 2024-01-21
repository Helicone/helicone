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
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-red-900 px-2 py-1 -my-1 text-xs font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-600/20">
          {jobStatus}
        </span>
      );
  }
};

export default JobStatus;
