import Cookies from "js-cookie";
import { useOrg } from "../../shared/layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { SUPABASE_AUTH_TOKEN } from "../../../lib/constants";
import { clsx } from "../../shared/clsx";

interface DeleteAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  alertId: string;
}

const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || "";

// REMOVE THE TRAILING V1 from the API_BASE_PATH
const API_BASE_PATH_WITHOUT_VERSION = API_BASE_PATH.replace("/v1", "");

const DeleteAlertModal = (props: DeleteAlertModalProps) => {
  const { open, setOpen, onSuccess, alertId } = props;

  const orgContext = useOrg();
  const { setNotification } = useNotification();

  const handleDeleteAlert = async (id: string) => {
    if (orgContext?.currentOrg?.id === undefined) {
      setNotification(
        "The organization you are trying to delete an alert for does not exist.",
        "error"
      );
      return;
    }
    try {
      const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);

      if (!authFromCookie) {
        setNotification("Please login to create an alert", "error");
        return;
      }

      const decodedCookie = decodeURIComponent(authFromCookie);
      const parsedCookie = JSON.parse(decodedCookie);
      const jwtToken = parsedCookie[0];
      const response = await fetch(
        `${API_BASE_PATH_WITHOUT_VERSION}/alert/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "helicone-jwt": jwtToken,
            "helicone-org-id": orgContext?.currentOrg?.id,
          },
        }
      );

      if (!response.ok) {
        setNotification(
          "There was an error deleting your alert! Refresh your page to try again..",
          "error"
        );
      }

      onSuccess();
      setOpen(false);
      setNotification("Successfully deleted alert", "success");
    } catch (error) {
      setNotification(`Error: ${error}`, "error");
    }
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col gap-4 w-full">
        <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
          Delete Alert
        </p>
        <p className="text-gray-500 w-[400px] whitespace-pre-wrap text-sm">
          This alert will be deleted from your account. All alert triggers will
          remain in the alert history. Are you sure you want to delete this
          alert permanently?
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
            onClick={() => {
              handleDeleteAlert(alertId);
            }}
            className={clsx(
              "relative inline-flex items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
            )}
          >
            Delete
          </button>
        </div>
      </div>
    </ThemedModal>
  );
};

export default DeleteAlertModal;
