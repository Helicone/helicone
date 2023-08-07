import { BeakerIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import { RequestView } from "./RequestView";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";

interface RequestDrawerV2Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  request?: NormalizedRequest;
  properties: string[];
}

const RequestDrawerV2 = (props: RequestDrawerV2Props) => {
  const { open, setOpen, request, properties } = props;

  const { setNotification } = useNotification();
  const router = useRouter();

  const setOpenHandler = (drawerOpen: boolean) => {
    // if the drawerOpen boolean is true, open the drawer
    if (drawerOpen) {
      setOpen(true);
    }
    // if the drawerOpen boolean is false, close the drawer and clear the requestId
    else {
      setOpen(false);
      const { pathname, query } = router;
      delete router.query.requestId;
      router.replace({ pathname, query }, undefined, { shallow: true });
    }
  };

  return (
    <ThemedDrawer
      open={open}
      setOpen={setOpenHandler}
      actions={
        <div className="w-full flex flex-row justify-between pl-1">
          <Tooltip title="Playground">
            <button
              onClick={() => {
                if (request) {
                  router.push("/playground?request=" + request.id);
                }
              }}
              className="hover:bg-gray-200 rounded-md -m-1 p-1"
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
              className="hover:bg-gray-200 rounded-md -m-1 p-1"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      }
    >
      {request ? (
        <RequestView request={request} properties={properties} open={open} />
      ) : (
        <p>Loading...</p>
      )}
    </ThemedDrawer>
  );
};

export default RequestDrawerV2;
