import Link from "next/link";
import { clsx } from "../../shared/clsx";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const CostPill = () => {
  return (
    <Link
      href={"https://github.com/Helicone/helicone/tree/main/costs"}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800",
        "w-max inline-flex items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset cursor-pointer"
      )}
    >
      Cost Unsupported{" "}
      <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 text-orange-500 inline-block" />
    </Link>
  );
};

export default CostPill;
