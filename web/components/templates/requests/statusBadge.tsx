import { clsx } from "@/components/shared/clsx";

interface StatusBadgeProps {
  statusType: string;
  errorCode?: number;
  className?: string;
}

const StatusBadge = (props: StatusBadgeProps) => {
  const { statusType, errorCode } = props;

  switch (statusType) {
    case "cached":
      return (
        <span
          className={clsx(
            "inline-flex items-center rounded-md bg-orange-50 dark:bg-orange-900 px-2 py-1 -my-1 text-xs font-medium text-orange-700 dark:text-orange-300 ring-1 ring-inset ring-orange-600/20",
            props.className
          )}
        >
          Cached
        </span>
      );
    case "success":
    case "COMPLETED":
      return (
        <span
          className={clsx(
            "inline-flex items-center rounded-md bg-green-50 dark:bg-green-900 px-2 py-1 -my-1 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20",
            props.className
          )}
        >
          Success
        </span>
      );
    case "pending":
    case "PENDING":
      return (
        <span
          className={clsx(
            "inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-900 px-2 py-1 -my-1 text-xs font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-600/20",
            props.className
          )}
        >
          Pending
        </span>
      );
    case "RUNNING":
      return (
        <span
          className={clsx(
            "inline-flex items-center rounded-md bg-blue-200 dark:bg-gray-900 px-2 py-1 -my-1 text-xs font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-600/20",
            props.className
          )}
        >
          Running
        </span>
      );

    case "error":
      if (errorCode === -2) {
        return (
          <span
            className={clsx(
              "inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-900 px-2 py-1 -my-1 text-xs font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-600/20",
              props.className
            )}
          >
            {`Pending`}
          </span>
        );
      } else if (errorCode === -3) {
        return (
          <span
            className={clsx(
              "inline-flex items-center rounded-md bg-orange-50 dark:bg-orange-900 px-2 py-1 -my-1 text-xs font-medium text-orange-700 dark:text-orange-300 ring-1 ring-inset ring-orange-600/20",
              props.className
            )}
          >
            {`Cancelled`}
          </span>
        );
      } else if (errorCode === -1) {
        return (
          <span
            className={clsx(
              "inline-flex items-center rounded-md bg-red-50 dark:bg-red-900 px-2 py-1 -my-1 text-xs font-medium text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-600/20",
              props.className
            )}
          >
            {`Timeout`}
          </span>
        );
      } else if (errorCode === -4) {
        return (
          <span
            className={clsx(
              "inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-900 px-2 py-1 -my-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 ring-1 ring-inset ring-red-600/20",
              props.className
            )}
          >
            {`Threat`}
          </span>
        );
      } else {
        return (
          <span
            className={clsx(
              "inline-flex items-center rounded-md bg-red-50 dark:bg-red-900 px-2 py-1 -my-1 text-xs font-medium text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-600/20",
              props.className
            )}
          >
            {`${errorCode} Error`}
          </span>
        );
      }
    default:
      return (
        <span
          className={clsx(
            "inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-900 px-2 py-1 -my-1 text-xs font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-600/20",
            props.className
          )}
        >
          Unknown
        </span>
      );
  }
};

export default StatusBadge;
