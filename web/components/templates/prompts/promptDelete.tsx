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
        className="flex items-center hover:bg-red-500 rounded-md p-1 -m-1 z-10 bg-red-600"
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
          <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            Delete Prompt: {promptName}
          </p>
          <p className="text-gray-500 w-[400px] whitespace-pre-wrap text-sm">
            Are you sure you want to delete this prompt?
          </p>
          <div className="w-full flex justify-end gap-4 mt-4">
            <button
              onClick={() => {
                setOpen(false);
              }}
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
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
                "relative inline-flex items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
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
