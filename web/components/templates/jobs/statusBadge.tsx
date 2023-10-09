import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { JobStatus } from "../../../lib/sql/jobs";

interface StatusBadgeProps {
  statusType: JobStatus;
  errorCode?: number;
}

const StatusBadge = (props: StatusBadgeProps) => {
  const { statusType, errorCode } = props;

  switch (statusType) {
    case "SUCCESS":
      return (
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          Success
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          {`Error`}
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          {`${errorCode} Cancelled`}
        </span>
      );
    case "PENDING":
      return (
        <span className="gap-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-blue-600/20">
          Running
          <ArrowPathIcon className={"animate-spin h-3 w-3 inline"} />
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
          Unknown
        </span>
      );
  }
};

export default StatusBadge;
