import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import ThemedModal from "../../shared/themed/themedModal";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";
import { TrashIcon } from "@heroicons/react/24/outline";

interface PromptDeleteProps {
  promptId: string;
  promptName: string;
  onSuccess: () => void;
}

const PromptDelete = (props: PromptDeleteProps) => {
  const { promptId, promptName, onSuccess } = props;
  const [open, setOpen] = useState(false);
  const jawnClient = useJawnClient();
  const { setNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className="z-10 -m-1 flex items-center rounded-md bg-red-600 p-1 hover:bg-red-500"
      >
        <TrashIcon className="h-4 w-4 text-white" />
      </button>
      <ThemedModal
        open={open}
        setOpen={(open) => {
          setOpen(open);
        }}
      >
        <div className="flex flex-col space-y-4">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Delete Prompt: {promptName}
          </p>
          <p className="w-[400px] whitespace-pre-wrap text-sm text-gray-500">
            Are you sure you want to delete this prompt?
          </p>
          <div className="mt-4 flex w-full justify-end gap-4">
            <button
              onClick={() => {
                setOpen(false);
              }}
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // handleDeleteAlert(alertId);
                setIsLoading(true);
                jawnClient
                  .DELETE(`/v1/prompt/{promptId}`, {
                    params: {
                      path: {
                        promptId: promptId,
                      },
                    },
                  })
                  .then((res) => {
                    if (res.error) {
                      setNotification("Error deleting prompt", "error");
                    } else {
                      setNotification("Prompt deleted", "success");
                      onSuccess();
                      setOpen(false);
                    }
                  })
                  .catch((err) => {
                    setNotification("Error deleting prompt", "error");
                  })
                  .finally(() => {
                    setIsLoading(false);
                  });
              }}
              className={
                "relative inline-flex items-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              }
            >
              {isLoading && <ArrowPathIcon className={"h-4 w-4"} />}
              Delete
            </button>
          </div>
        </div>
      </ThemedModal>
    </div>
  );
};

export default PromptDelete;
