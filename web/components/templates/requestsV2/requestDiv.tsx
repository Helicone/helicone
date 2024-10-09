import { BeakerIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import useNotification from "../../shared/notification/useNotification";
import ThemedDiv from "../../shared/themed/themedDiv";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import RequestRow from "./requestRow";

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

  return (
    <ThemedDiv
      open={open}
      setOpen={setOpenHandler}
      actions={
        <div className="w-full flex flex-row justify-between items-center">
          <div className="flex flex-row items-center space-x-2">
            <Tooltip title="Playground">
              <button
                onClick={() => {
                  if (request) {
                    router.push("/playground?request=" + request.id);
                  }
                }}
                className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md -m-1 p-1"
              >
                <BeakerIcon className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip title="Copy">
              <button
                onClick={() => {
                  setNotification("Copied to clipboard", "success");
                  const copy = { ...request };
                  delete copy.render;
                  navigator.clipboard.writeText(
                    JSON.stringify(copy || {}, null, 4)
                  );
                }}
                className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md -m-1 p-1"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
          {(hasPrevious || hasNext) && (
            <div className="flex flex-row items-center space-x-1.5">
              <Tooltip title="Previous">
                <button
                  onClick={onPrevHandler}
                  disabled={!hasPrevious}
                  className={clsx(
                    !hasPrevious && "opacity-50 hover:cursor-not-allowed",
                    "hover:bg-gray-200 dark:hover:bg-gray-800  rounded-md -m-1 p-1"
                  )}
                >
                  <ArrowUpIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip title="Next">
                <button
                  onClick={onNextHandler}
                  disabled={!hasNext}
                  className={clsx(
                    !hasNext && "opacity-50 hover:cursor-not-allowed",
                    "hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md -m-1 p-1"
                  )}
                >
                  <ArrowDownIcon className="h-5 w-5" />
                </button>
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
