import { BeakerIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { useRouter } from "next/router";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import RequestRow from "./requestRow";
import { useMemo } from "react";

interface RequestDrawerV2Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevHandler?: () => void;
  onNextHandler?: () => void;
  request?: NormalizedRequest;
  properties?: string[];
}

const RequestDrawerV2 = (props: RequestDrawerV2Props) => {
  const {
    open,
    setOpen,
    hasPrevious,
    hasNext,
    onPrevHandler,
    onNextHandler,
    request,
    properties: propsProperties,
  } = props;

  const { setNotification } = useNotification();
  const router = useRouter();

  const properties = useMemo(
    () =>
      ((propsProperties?.length ?? 0) > 0
        ? propsProperties
        : Object.keys(request?.customProperties ?? {})) ?? [],
    [request, propsProperties]
  );
  const setOpenHandler = (drawerOpen: boolean) => {
    // if the drawerOpen boolean is true, open the drawer
    if (drawerOpen) {
      setOpen(true);
    }
    // if the drawerOpen boolean is false, close the drawer and clear the requestId
    else {
      setOpen(false);
      const { pathname, query } = router;
      // only delete and replace if the request id exists in the router
      if (router.query.requestId) {
        delete router.query.requestId;
        router.replace({ pathname, query }, undefined, { shallow: true });
      }
    }
  };

  return (
    <ThemedDrawer
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
    </ThemedDrawer>
  );
};

export default RequestDrawerV2;
