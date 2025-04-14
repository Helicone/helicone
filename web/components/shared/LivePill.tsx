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
    <div className="h-8 w-full flex flex-row items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-lg border border-border divide-x divide-border">
      <Button
        variant="none"
        size="none"
        className="h-full px-2.5 flex flex-row gap-2 items-center rounded-l-lg rounded-r-none hover:bg-slate-100 dark:hover:bg-slate-900 active:bg-slate-200 active:dark:bg-slate-800"
        onClick={() => setIsLive(!isLive)}
      >
        <div
          className={clsx(
            isLive ? "bg-green-500 animate-pulse" : "bg-slate-500",
            "h-2 w-2 rounded-full"
          )}
        />
        <span className="text-xs whitespace-nowrap">
          {isLive ? "Live" : "Start Live"}
        </span>
      </Button>

      <Button
        variant="none"
        size="none"
        className="h-full px-2.5 flex flex-row gap-1 items-center rounded-l-none rounded-r-lg hover:bg-slate-100 dark:hover:bg-slate-900 active:bg-slate-200 active:dark:bg-slate-800"
        onClick={() => {
          refetch();
        }}
      >
        <ArrowPathIcon
          className={clsx(
            isDataLoading || isRefetching ? "animate-spin" : "",
            "h-4 w-4 inline duration-500 ease-in-out"
          )}
        />
      </Button>
    </div>
  );
}
