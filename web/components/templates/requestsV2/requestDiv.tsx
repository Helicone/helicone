import { BeakerIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import useNotification from "../../shared/notification/useNotification";
import ThemedDiv from "../../shared/themed/themedDiv";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import RequestRow from "./requestRow";
import { useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

interface RequestDivProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevHandler?: () => void;
  onNextHandler?: () => void;
  request?: NormalizedRequest;
  properties: string[];
}

const RequestDiv = (props: RequestDivProps) => {
  const {
    open,
    setOpen,
    hasPrevious,
    hasNext,
    onPrevHandler,
    onNextHandler,
    request,
    properties,
  } = props;

  const { setNotification } = useNotification();
  const router = useRouter();

  const setOpenHandler = (divOpen: boolean) => {
    setOpen(divOpen);
    if (!divOpen) {
      const { pathname, query } = router;
      if (router.query.requestId) {
        delete router.query.requestId;
        router.replace({ pathname, query }, undefined, { shallow: true });
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        onPrevHandler?.();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        onNextHandler?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onNextHandler, onPrevHandler, setOpen]);

  return (
    <ThemedDiv
      open={open}
      setOpen={setOpenHandler}
      actions={
        <div className="w-full flex flex-row justify-between items-center">
          <div className="flex flex-row items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={request ? `/playground?request=${request.id}` : "#"}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400 inline-block"
                >
                  <BeakerIcon className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Playground</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setNotification("Copied to clipboard", "success");
                    const copy = { ...request };
                    delete copy.render;
                    navigator.clipboard.writeText(
                      JSON.stringify(copy || {}, null, 4)
                    );
                  }}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
          </div>
          {(hasPrevious || hasNext) && (
            <div className="flex flex-row items-center space-x-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onPrevHandler}
                    disabled={!hasPrevious}
                    className={clsx(
                      !hasPrevious && "opacity-50 hover:cursor-not-allowed",
                      "hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400"
                    )}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Previous</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onNextHandler}
                    disabled={!hasNext}
                    className={clsx(
                      !hasNext && "opacity-50 hover:cursor-not-allowed",
                      "hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400"
                    )}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Next</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      }
    >
      {request ? (
        <RequestRow request={request} properties={properties} open={open} />
      ) : (
        <p>Loading...</p>
      )}
    </ThemedDiv>
  );
};

export default RequestDiv;
