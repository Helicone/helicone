import {
  ClipboardDocumentIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/router";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import EditDataset from "./EditDataset";
import { useState, useEffect } from "react";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import { Button } from "../../ui/button";
import { Check, X } from "lucide-react";
import RemoveRequestsModal from "./RemoveRequests";
import { useGetHeliconeDatasetRows } from "@/services/hooks/dataset/heliconeDataset";

type DatasetRow =
  | ReturnType<typeof useGetHeliconeDatasetRows>["rows"][number]
  | null;

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
  const [editedRequestBody, setEditedRequestBody] = useState("");
  const [editedResponseBody, setEditedResponseBody] = useState("");
  const [originalRequestBody, setOriginalRequestBody] = useState("");
  const [originalResponseBody, setOriginalResponseBody] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (selectedRow) {
      const newRequestBody = JSON.stringify(
        selectedRow.request_response_body?.request,
        null,
        2,
      );
      const newResponseBody = JSON.stringify(
        selectedRow.request_response_body?.response,
        null,
        2,
      );
      setEditedRequestBody(newRequestBody);
      setEditedResponseBody(newResponseBody);
      setOriginalRequestBody(newRequestBody);
      setOriginalResponseBody(newResponseBody);
    }
  }, [selectedRow]);

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

  const handleDiscard = () => {
    setEditedRequestBody(originalRequestBody);
    setEditedResponseBody(originalResponseBody);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const result = await jawn.POST(
        `/v1/helicone-dataset/{datasetId}/request/{requestId}`,
        {
          params: {
            path: {
              datasetId: datasetId,
              requestId: selectedRow?.id as string,
            },
          },
          body: {
            requestBody: JSON.parse(editedRequestBody),
            responseBody: JSON.parse(editedResponseBody),
          },
        },
      );
      if (result.data?.error) {
        setNotification("Error updating dataset request", "error");
      } else {
        setNotification("Dataset request updated", "success");
        setOriginalRequestBody(editedRequestBody);
        setOriginalResponseBody(editedResponseBody);
        setIsEditing(false);
        refetch();
      }
    } catch (error) {
      setNotification((error as Error).message, "error");
    }
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
    <>
      <ThemedDrawer
        open={open}
        setOpen={setOpenHandler}
        defaultWidth="w-[80vw]"
        defaultExpanded={true}
        actions={
          <div className="flex w-full flex-row items-center justify-between">
            <div></div>
            <div className="flex h-12 flex-row items-center space-x-2">
              {isEditing ? (
                <>
                  <span className="whitespace-nowrap rounded-md bg-[#F1F5F9] p-2 text-sm font-medium text-[#1876D2] dark:text-gray-100">
                    Editing
                  </span>
                  <Button variant="outline" onClick={handleDiscard}>
                    <X className="mr-2 h-5 w-5" /> Discard
                  </Button>
                  <Button variant="default" onClick={handleSave}>
                    <Check className="mr-2 h-5 w-5" /> Save changes
                  </Button>
                </>
              ) : (
                <>
                  {" "}
                  {(hasPrevious || hasNext) && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={onPrevHandler}
                              disabled={!hasPrevious}
                              className={clsx(
                                !hasPrevious &&
                                  "opacity-50 hover:cursor-not-allowed",
                                "-m-1 rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-800",
                              )}
                            >
                              <ArrowUpIcon className="h-5 w-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Previous</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={onNextHandler}
                              disabled={!hasNext}
                              className={clsx(
                                !hasNext &&
                                  "opacity-50 hover:cursor-not-allowed",
                                "-m-1 rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-800",
                              )}
                            >
                              <ArrowDownIcon className="h-5 w-5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Next</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setNotification("Copied to clipboard", "success");
                            navigator.clipboard.writeText(
                              JSON.stringify(selectedRow || {}, null, 4),
                            );
                          }}
                          className="-m-1 rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-800"
                        >
                          <ClipboardDocumentIcon className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="-m-1 rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-800"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          className="-m-1 rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
          </div>
        }
      >
        {selectedRow ? (
          <EditDataset
            selectedRow={selectedRow}
            isEditing={isEditing}
            requestBody={editedRequestBody}
            responseBody={editedResponseBody}
            onRequestBodyChange={setEditedRequestBody}
            onResponseBodyChange={setEditedResponseBody}
          />
        ) : (
          <p>Loading...</p>
        )}
      </ThemedDrawer>

      <RemoveRequestsModal
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        requestCount={1}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default DatasetDrawerV2;
