import {
  BeakerIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import { DatasetRow } from "./datasetsIdPage";
import EditDataset from "./EditDataset";
import { useState } from "react";
import { useJawnClient } from "../../../lib/clients/jawnHook";

interface DatasetDrawerV2Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevHandler?: () => void;
  onNextHandler?: () => void;
  selectedRow?: DatasetRow;
  datasetId: string;
  onDelete: () => void;
  refetch: () => void;
}

const DatasetDrawerV2 = (props: DatasetDrawerV2Props) => {
  const {
    open,
    setOpen,
    hasPrevious,
    hasNext,
    onPrevHandler,
    onNextHandler,
    selectedRow,
    datasetId,
    onDelete,
    refetch,
  } = props;

  const { setNotification } = useNotification();
  const router = useRouter();
  const jawn = useJawnClient();
  const [isEditing, setIsEditing] = useState(false);

  const setOpenHandler = (drawerOpen: boolean) => {
    if (!drawerOpen) {
      const { pathname, query } = router;
      if (router.query.requestId) {
        delete router.query.requestId;
        router.replace({ pathname, query }, undefined, { shallow: true });
      }
    }
    setOpen(drawerOpen);
  };

  const handleDelete = async () => {
    if (!selectedRow) return;

    try {
      await jawn.POST(`/v1/helicone-dataset/{datasetId}/mutate`, {
        params: {
          path: {
            datasetId: datasetId,
          },
        },
        body: {
          addRequests: [],
          removeRequests: [selectedRow.id],
        },
      });
      setNotification("Request removed from dataset", "success");
      onDelete();
      setOpen(false);
    } catch (error) {
      setNotification("Failed to remove request from dataset", "error");
    }
  };

  return (
    <ThemedDrawer
      open={open}
      setOpen={setOpenHandler}
      defaultWidth="w-[80vw]"
      defaultExpanded={true}
      actions={
        <div className="w-full flex flex-row justify-between items-center">
          <div></div>
          <div className="flex flex-row items-center space-x-2">
            {(hasPrevious || hasNext) && (
              <>
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
              </>
            )}
            <Tooltip title="Copy">
              <button
                onClick={() => {
                  setNotification("Copied to clipboard", "success");
                  navigator.clipboard.writeText(
                    JSON.stringify(selectedRow || {}, null, 4)
                  );
                }}
                className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md -m-1 p-1"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip title="Edit">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md -m-1 p-1"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip title="Delete">
              <button
                onClick={handleDelete}
                className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md -m-1 p-1"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      }
    >
      {selectedRow ? (
        <EditDataset
          selectedRow={selectedRow}
          isEditing={isEditing}
          onSave={() => {
            setIsEditing(false);
            refetch();
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <p>Loading...</p>
      )}
    </ThemedDrawer>
  );
};

export default DatasetDrawerV2;
