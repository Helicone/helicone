import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  statusType: string;
  errorCode?: number;
  className?: string;
}

const StatusBadge = (props: StatusBadgeProps) => {
  const { statusType, errorCode } = props;

  let colorClass: string;

  switch (statusType) {
    case "cached":
      colorClass = "bg-amber-500 dark:bg-amber-600";
      return (
        <Badge variant="status" className={colorClass}>
          Cached
        </Badge>
      );
    case "success":
    case "COMPLETED":
      colorClass = "bg-green-500 dark:bg-green-600";
      return (
        <Badge variant="status" className={colorClass}>
          Success
        </Badge>
      );
    case "pending":
    case "PENDING":
      colorClass = "bg-slate-500 dark:bg-slate-600";
      return (
        <Badge variant="status" className={colorClass}>
          Pending
        </Badge>
      );
    case "RUNNING":
      colorClass = "bg-blue-500 dark:bg-blue-600";
      return (
        <Badge variant="status" className={colorClass}>
          Running
        </Badge>
      );

    case "error":
      if (errorCode === -2) {
        colorClass = "bg-slate-500 dark:bg-slate-600";
        return (
          <Badge variant="status" className={colorClass}>
            Pending
          </Badge>
        );
      } else if (errorCode === -3) {
        colorClass = "bg-purple-500 dark:bg-purple-600";
        return (
          <Badge variant="status" className={colorClass}>
            Cancelled
          </Badge>
        );
      } else if (errorCode === -1) {
        colorClass = "bg-rose-500 dark:bg-rose-600";
        return (
          <Badge variant="status" className={colorClass}>
            Timeout
          </Badge>
        );
      } else if (errorCode === -4) {
        colorClass = "bg-yellow-500 dark:bg-yellow-600";
        return (
          <Badge variant="status" className={colorClass}>
            Threat
          </Badge>
        );
      } else {
        colorClass = "bg-red-500 dark:bg-red-600";
        return (
          <Badge variant="status" className={colorClass}>
            {`${errorCode} Error`}
          </Badge>
        );
      }
    default:
      colorClass = "bg-gray-500 dark:bg-gray-600";
      return (
        <Badge variant="status" className={colorClass}>
          Unknown
        </Badge>
      );
  }
};

export default StatusBadge;
