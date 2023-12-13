import { FormEvent, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Cookies from "js-cookie";

import ThemedModal from "../../shared/themed/themedModal";
import useNotification from "../../shared/notification/useNotification";
import { SUPABASE_AUTH_TOKEN } from "../../../lib/constants";
import { Database } from "../../../supabase/database.types";

interface DeleteAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  orgId: string;
  alertId: Database["public"]["Tables"]["alert_history"]["Row"] | null;
  onSuccess: () => void;
}

const DeleteAlertModal = ({
  open,
  setOpen,
  orgId,
  alertId,
  onSuccess,
}: DeleteAlertModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setNotification } = useNotification();

  const handleDeleteAlert = async () => {
    if (!alertId) {
      setNotification("No alert selected to delete", "error");
      return;
    }

    try {
      const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);
      if (!authFromCookie) {
        setNotification("Please login to delete an alert", "error");
        return;
      }
      const decodedCookie = decodeURIComponent(authFromCookie);
      const parsedCookie = JSON.parse(decodedCookie);
      const jwtToken = parsedCookie[0];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH}/alert/${alertId["id"]}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "helicone-jwt": jwtToken,
            "helicone-org-id": orgId,
          },
        }
      );

      if (response.ok) {
        onSuccess(); // Call onSuccess callback to refresh alerts list
        setOpen(false); // Close the modal
      } else {
        setNotification("Failed to delete alert. Please try again.", "error");
      }
    } catch (error) {
      setNotification(
        "An error occurred while deleting the alert. Please try again.",
        "error"
      );
    }
  };

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    await handleDeleteAlert();
    setIsLoading(false);
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <form
        onSubmit={handleSubmitHandler}
        className="flex flex-col space-y-4 w-[400px]"
      >
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Delete Alert
        </h1>
        <div className="w-full space-y-1.5 text-sm">
          <p>
            Are you sure you want to delete this alert? This action is
            irreversible.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            type="button"
            className="rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isLoading && (
              <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
            )}
            Delete Alert
          </button>
        </div>
      </form>
    </ThemedModal>
  );
};

export default DeleteAlertModal;
