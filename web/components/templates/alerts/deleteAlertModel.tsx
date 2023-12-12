import ThemedModal from "../../shared/themed/themedModal";
import useNotification from "../../shared/notification/useNotification";
import { User } from "@supabase/auth-helpers-react";
import { FormEvent, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Cookies from "js-cookie";
import { SUPABASE_AUTH_TOKEN } from "../../../lib/constants";
import { ThemedPill } from "../../shared/themed/themedPill";
import ThemedDropdown from "../../shared/themed/themedDropdown";

interface CreateNewAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: User | null;
  orgId: string;
  onSuccess: () => void;
}

const CreateNewAlertModal = (props: CreateNewAlertModalProps) => {
  const { open, setOpen, user, orgId, onSuccess } = props;
  const [isLoading, setIsLoading] = useState(false);
  const { setNotification } = useNotification();
  const [emails, setEmails] = useState<string[]>([]); // State to manage emails
  const [emailInput, setEmailInput] = useState(""); // State to track the email input field
  const [selectedMetric, setSelectedMetric] = useState<string>("");

  const availableMetrics = [
    { label: "Response Status", value: "response.status" },
    // { label: "Response Time", value: "response.time" },
  ];
  // Function to add email to the state
  const handleAddEmails = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === " " || event.key === "Enter") {
      const email = emailInput.trim();
      if (email) {
        setEmails((oldEmails: string[]) => [...oldEmails, email]); // Add email to the state
        setEmailInput(""); // Clear input field
      }
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails((oldEmails) =>
      oldEmails.filter((email) => email !== emailToRemove)
    );
  };

  const handleEmailInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEmailInput(event.target.value);
  };

  const handleSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Auth
    const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);
    if (!authFromCookie) {
      setNotification("Please login to create an alert", "error");
      return;
    }
    const decodedCookie = decodeURIComponent(authFromCookie);
    const parsedCookie = JSON.parse(decodedCookie);
    const jwtToken = parsedCookie[0];

    const alertName = event.currentTarget.elements.namedItem(
      "alert-name"
    ) as HTMLInputElement;
    const alertMetric = event.currentTarget.elements.namedItem(
      "alert-metric"
    ) as HTMLInputElement;
    const alertThreshold = event.currentTarget.elements.namedItem(
      "alert-threshold"
    ) as HTMLInputElement;
    const alertEmails = event.currentTarget.elements.namedItem(
      "alert-emails"
    ) as HTMLInputElement;
    const alertTimeWindow = event.currentTarget.elements.namedItem(
      "alert-time-window"
    ) as HTMLInputElement;

    // Check if all fields are filled out
    if (
      !selectedMetric ||
      !emails ||
      !alertName ||
      !alertThreshold ||
      !alertTimeWindow ||
      selectedMetric === "" ||
      emails.length === 0 ||
      alertName.value === "" ||
      alertThreshold.value === "" ||
      alertTimeWindow.value === ""
    ) {
      setNotification("Please fill out all fields", "error");
      return;
    }

    const thresholdValue = parseInt(alertThreshold.value);
    if (isNaN(thresholdValue) || thresholdValue < 1 || thresholdValue > 100) {
      setNotification("Threshold must be between 1 and 100", "error");
      setIsLoading(false);
      return;
    }

    // http://localhost:8787/alerts
    //   curl --request POST \
    //   --url http://localhost:8787/alerts \
    //   --header 'Content-Type: application/json' \
    //   --header 'User-Agent: insomnia/8.4.5' \
    //   --data '{
    //   "name": "Error Rate 50%",
    //   "metric": "response.status",
    //   "threshold": 50,
    //   "time_window": 300000,
    //   "emails": ["colegottdank@gmail.com"],
    //   "org_id": "83635a30-5ba6-41a8-8cc6-fb7df941b24a"
    // }

    // TODO: Needs to be dynamic
    const res = fetch(`http://localhost:8787/alerts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "helicone-jwt": jwtToken,
        "helicone-org-id": orgId,
      },
      body: JSON.stringify({
        name: alertName.value,
        metric: selectedMetric,
        threshold: alertThreshold.value,
        time_window: alertTimeWindow.value,
        emails: emails,
        org_id: orgId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setNotification("Successfully created alert", "success");
        setIsLoading(false);
        onSuccess();
      })
      .catch((err) => {
        console.log(err);
        setNotification("Failed to create alert", "error");
        setIsLoading(false);
      });
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <form
        action="javascript:void(0)"
        method="POST"
        onSubmit={handleSubmitHandler}
        className="flex flex-col space-y-4 w-[400px]"
      >
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Delete Alert
        </h1>
        <div className="w-full space-y-1.5 text-sm">
          <p>Are you sure you want to delete your alert?</p>
          <p>This is final and irreversible.</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            type="button"
            className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isLoading && (
              <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
            )}
            Create Alert
          </button>
        </div>
      </form>
    </ThemedModal>
  );
};
export default CreateNewAlertModal;
