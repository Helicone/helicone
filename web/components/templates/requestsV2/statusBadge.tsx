interface StatusBadgeProps {
  status: number | null;
}

const StatusBadge = (props: StatusBadgeProps) => {
  const { status } = props;

  switch (status) {
    case 200:
      return (
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          Success
        </span>
      );
    case 0:
    case null:
      return (
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
          Pending
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          {`${status} Error`}
        </span>
      );
  }
};

export default StatusBadge;
