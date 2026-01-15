import { ArrowPathIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Button } from "../ui/button";

interface LivePillProps {
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
  isDataLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;
}
export default function LivePill(props: LivePillProps) {
  const { isLive, setIsLive, isDataLoading, isRefetching, refetch } = props;
  return (
    <div className="flex h-8 flex-row items-center divide-x divide-border rounded-lg border border-border bg-slate-50 dark:bg-slate-950">
      <Button
        variant="none"
        size="none"
        className="flex h-full flex-row items-center gap-2 rounded-l-lg rounded-r-none px-2.5 hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-900 active:dark:bg-slate-800"
        onClick={() => setIsLive(!isLive)}
      >
        <div
          className={clsx(
            isLive ? "animate-pulse bg-green-500" : "bg-slate-500",
            "h-2 w-2 rounded-full",
          )}
        />
        <span className="whitespace-nowrap text-xs">
          {isLive ? "Live" : "Start Live"}
        </span>
      </Button>

      <Button
        variant="none"
        size="none"
        className="flex h-full flex-row items-center gap-1 rounded-l-none rounded-r-lg px-2.5 hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-900 active:dark:bg-slate-800"
        onClick={() => {
          refetch();
        }}
      >
        <ArrowPathIcon
          className={clsx(
            isDataLoading || isRefetching
              ? "animate-spin duration-500 ease-in-out"
              : "",
            isLive ? "animate-spin duration-1000" : "",
            "inline h-4 w-4",
          )}
        />
      </Button>
    </div>
  );
}
