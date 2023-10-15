import { NormalizedRequest } from "./builder/abstractRequestBuilder";

interface StatusBadgeProps {
  statusType: NormalizedRequest["status"]["statusType"];
  errorCode?: number;
}

const StatusBadge = (props: StatusBadgeProps) => {
  const { statusType, errorCode } = props;

  switch (statusType) {
    case "cached":
      return (
        <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 -my-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
          Cached
        </span>
      );
    case "success":
      return (
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 -my-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          Success
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 -my-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
          Pending
        </span>
      );

    case "error":
      if (errorCode === -2) {
        return (
          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 -my-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
            {`Pending`}
          </span>
        );
      }
      if (errorCode === -3) {
        return (
          <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 -my-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
            {`Cancelled`}
          </span>
        );
      }
      if (errorCode === -1) {
        return (
          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 -my-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            {`Timeout`}
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 -my-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            {`${errorCode} Error`}
          </span>
        );
      }
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 -my-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
          Unknown
        </span>
      );
  }
};

export default StatusBadge;
