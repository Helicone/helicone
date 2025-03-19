import { ArrowPathIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Button } from "../ui/button";

interface LiveButtonProps {
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
  isDataLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;
}
export default function LiveButton(props: LiveButtonProps) {
  const { isLive, setIsLive, isDataLoading, isRefetching, refetch } = props;
  return (
    <div className="h-9 w-full flex flex-row items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-full border border-border">
      <Button
        variant="none"
        size="none"
        className="h-full px-3 flex flex-row gap-2 items-center rounded-l-full hover:bg-slate-100 dark:hover:bg-slate-900 active:bg-slate-200 active:dark:bg-slate-800"
        onClick={() => setIsLive(!isLive)}
      >
        <div
          className={clsx(
            isLive ? "bg-green-500 animate-pulse" : "bg-slate-500",
            "h-2 w-2 rounded-full"
          )}
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {isLive ? "Live" : "Start Live"}
        </span>
      </Button>

      <Button
        variant="none"
        size="none"
        className="h-full px-3 flex flex-row gap-1 items-center rounded-r-full hover:bg-slate-100 dark:hover:bg-slate-900 active:bg-slate-200 active:dark:bg-slate-800"
        onClick={() => {
          refetch();
        }}
      >
        <ArrowPathIcon
          className={clsx(
            isDataLoading || isRefetching ? "animate-spin" : "",
            "h-4 w-4 inline text-muted-foreground duration-500 ease-in-out"
          )}
        />
      </Button>
    </div>
  );
}
