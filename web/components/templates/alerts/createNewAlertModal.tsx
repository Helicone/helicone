import { MultiSelect, MultiSelectItem } from "@tremor/react";
import Cookies from "js-cookie";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

import ThemedModal from "../../shared/themed/themedModal";
import useNotification from "../../shared/notification/useNotification";
import { FormEvent, useState } from "react";
import { SUPABASE_AUTH_TOKEN } from "../../../lib/constants";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import { useGetOrgMembersAndOwner } from "../../../services/hooks/organizations";

interface CreateNewAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  orgId: string;
  onSuccess: () => void;
}

const CreateNewAlertModal = (props: CreateNewAlertModalProps) => {
  const { open, setOpen, orgId, onSuccess } = props;
  const { data: orgMembers, isLoading: isOrgMembersLoading } =
    useGetOrgMembersAndOwner(orgId);
  const [isLoading, setIsLoading] = useState(false);
  const { setNotification } = useNotification();
  const [emails, setEmails] = useState<string[]>([]); // State to manage emails
  const [currentEmails, setCurrentEmails] = useState<string[]>([]); // State to manage emails
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>("");

  const memberEmails =
    orgMembers?.members?.data?.map((member) => member.email) ?? [];
  const ownerEmail = orgMembers?.owner?.data?.map((owner) => owner.email) ?? [];
  const combinedEmails = [...memberEmails, ...ownerEmail];
  if (combinedEmails.length > 0 && emails.length === 0) {
    setEmails(combinedEmails);
  }

  console.log(currentEmails);

  const availableMetrics = [
    { label: "Response Status", value: "response.status" },
    // { label: "Response Time", value: "response.time" },
  ];

  const availableTimeWindows = [
    // 5 min, 10, 15, 30 and 1 hour
    { label: "5 Minutes", value: "300000" },
    { label: "10 Minutes", value: "600000" },
    { label: "15 Minutes", value: "900000" },
    { label: "30 Minutes", value: "1800000" },
    { label: "1 Hour", value: "3600000" },
  ];

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
    const alertThreshold = event.currentTarget.elements.namedItem(
      "alert-threshold"
    ) as HTMLInputElement;

    // Check if all fields are filled out
    if (
      !selectedMetric ||
      !emails ||
      !alertName ||
      !alertThreshold ||
      !selectedTimeWindow ||
      selectedMetric === "" ||
      currentEmails.length === 0 ||
      alertName.value === "" ||
      alertThreshold.value === "" ||
      selectedTimeWindow === ""
    ) {
      setNotification("Please fill out all fields", "error");
      return;
    }

    const thresholdValue = parseInt(alertThreshold.value);
    const alertTimeWindow = parseInt(selectedTimeWindow);
    if (isNaN(thresholdValue) || thresholdValue < 1 || thresholdValue > 100) {
      setNotification("Threshold must be between 1 and 100", "error");
      setIsLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH}/alerts`, {
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
        time_window: alertTimeWindow,
        emails: currentEmails,
        org_id: orgId,
      }),
    })
      .then(() => {
        setNotification("Successfully created alert", "success");
        setIsLoading(false);
        onSuccess();
        setOpen(false);
      })
      .catch(() => {
        setNotification("Failed to create alert", "error");
        setIsLoading(false);
      });
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <form
        onSubmit={handleSubmitHandler}
        className="flex flex-col space-y-4 w-[400px]"
      >
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Create Alert
        </h1>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="alert-name" className="text-gray-500">
            Alert Name
          </label>
          <input
            type="text"
            name="alert-name"
            id="alert-name"
            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm p-2 text-sm"
            required
            placeholder="Request Error Rate 50%"
          />
        </div>
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="alert-name" className="text-gray-500">
            Alert Metric
          </label>
          <ThemedDropdown
            options={availableMetrics}
            selectedValue={selectedMetric}
            onSelect={(value) => setSelectedMetric(value)}
          />
        </div>{" "}
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="alert-name" className="text-gray-500">
            Alert Threshold
          </label>
          <input
            type="number"
            inputMode="numeric"
            name="alert-threshold"
            id="alert-threshold"
            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm p-2 text-sm"
            required
            placeholder="Percentage (Between 0-100)"
            min={1}
            max={100}
          />
        </div>{" "}
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="alert-name" className="text-gray-500">
            Alert Emails
          </label>
          <MultiSelect
            placeholder="Select emails"
            value={currentEmails}
            onValueChange={(values: string[]) => {
              setCurrentEmails(
                values.sort((a, b) => {
                  return Number(a) - Number(b);
                })
              );
            }}
            className="border border-gray-400 rounded-lg"
          >
            {emails.map((email) => (
              <MultiSelectItem
                key={email}
                value={email}
                className="font-medium text-black"
              >
                {email}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </div>{" "}
        <div className="w-full space-y-1.5 text-sm">
          <label htmlFor="alert-name" className="text-gray-500">
            Alert Time Window (ms)
          </label>
          <ThemedDropdown
            options={availableTimeWindows}
            selectedValue={selectedTimeWindow}
            onSelect={(value) => setSelectedTimeWindow(value)}
            verticalAlign="top"
          />
        </div>{" "}
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
