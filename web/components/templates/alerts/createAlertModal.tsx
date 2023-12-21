import { FormEvent, useState } from "react";
import ThemedModal from "../../shared/themed/themedModal";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import {
  MultiSelect,
  MultiSelectItem,
  Select,
  SelectItem,
} from "@tremor/react";
import { useOrg } from "../../shared/layout/organizationContext";
import {
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../services/hooks/organizations";
import Cookies from "js-cookie";
import { SUPABASE_AUTH_TOKEN } from "../../../lib/constants";
import useNotification from "../../shared/notification/useNotification";
import { useUser } from "@supabase/auth-helpers-react";
import {
  CodeBracketSquareIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { clsx } from "../../shared/clsx";
import { alertTimeWindows } from "./alertsPage";

interface CreateAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}

const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || "";

// REMOVE THE TRAILING V1 from the API_BASE_PATH
const API_BASE_PATH_WITHOUT_VERSION = API_BASE_PATH.replace("/v1", "");

const CreateAlertModal = (props: CreateAlertModalProps) => {
  const { open, setOpen, onSuccess } = props;

  const [selectedMetric, setSelectedMetric] =
    useState<string>("response.status");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>("");

  const orgContext = useOrg();
  const user = useUser();

  const { data, isLoading, refetch } = useGetOrgMembers(
    orgContext?.currentOrg.id || ""
  );

  const { data: orgOwner, isLoading: isOrgOwnerLoading } = useGetOrgOwner(
    orgContext?.currentOrg.id || ""
  );

  const { setNotification } = useNotification();

  const members: {
    email: string;
    member: string;
    org_role: string;
  }[] = [
    {
      email: orgOwner?.data?.at(0)?.email || "",
      member: "",
      org_role: "admin",
    },
    ...(data?.data || []),
  ];

  const handleCreateAlert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (orgContext?.currentOrg.id === undefined) {
      return;
    }

    const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);
    if (!authFromCookie) {
      setNotification("Please login to create an alert", "error");
      return;
    }
    const decodedCookie = decodeURIComponent(authFromCookie);
    const parsedCookie = JSON.parse(decodedCookie);
    const jwtToken = parsedCookie[0];

    const formData = new FormData(event.currentTarget);

    const alertName = formData.get("alert-name") as string;
    const alertThreshold = Number(formData.get("alert-threshold") as string);
    const alertMinRequests = Number(formData.get("min-requests") as string);

    if (selectedMetric === "response.status") {
      if (isNaN(alertThreshold) || alertThreshold < 0 || alertThreshold > 100) {
        setNotification("Please enter a valid threshold", "error");
        return;
      }
    }

    if (selectedMetric === "cost") {
      if (isNaN(alertThreshold) || alertThreshold < 0) {
        setNotification("Please enter a valid threshold", "error");
        return;
      }
    }

    if (selectedEmails.length < 1) {
      setNotification("Please select at least one email", "error");
      return;
    }

    if (selectedMetric === "") {
      setNotification("Please select a metric", "error");
      return;
    }

    if (selectedTimeWindow === "") {
      setNotification("Please select a time window", "error");
      return;
    }

    console.log(
      "body",
      JSON.stringify({
        name: alertName,
        metric: selectedMetric,
        threshold: alertThreshold,
        time_window: selectedTimeWindow,
        emails: selectedEmails,
        org_id: orgContext?.currentOrg.id,
        minimum_request_count: isNaN(alertMinRequests)
          ? undefined
          : alertMinRequests,
      })
    );

    // fetch(`${API_BASE_PATH_WITHOUT_VERSION}/alerts`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "helicone-jwt": jwtToken,
    //     "helicone-org-id": orgContext?.currentOrg.id,
    //   },
    //   body: JSON.stringify({
    //     name: alertName,
    //     metric: selectedMetric,
    //     threshold: alertThreshold,
    //     time_window: selectedTimeWindow,
    //     emails: selectedEmails,
    //     org_id: orgContext?.currentOrg.id,
    //     minimum_request_count: isNaN(alertMinRequests)
    //       ? undefined
    //       : alertMinRequests,
    //   }),
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     setNotification("Successfully created alert", "success");
    //     setOpen(false);
    //     onSuccess();
    //   })
    //   .catch((err) => {
    //     setNotification(`Failed to create alert ${err}`, "error");
    //   });
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <form
        onSubmit={handleCreateAlert}
        className="grid grid-cols-4 gap-8 w-full sm:w-[450px] max-w-[450px] h-full"
      >
        <h1 className="col-span-4 font-semibold text-xl text-gray-900 dark:text-gray-100">
          Create Alert
        </h1>
        <div className="col-span-4 w-full space-y-1.5 text-sm">
          <label htmlFor="alert-name" className="text-gray-500">
            Name
          </label>
          <input
            type="text"
            name="alert-name"
            id="alert-name"
            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-gray-100 shadow-sm p-2 text-sm"
            required
            placeholder="Alert Name"
          />
        </div>

        <div className="col-span-2 w-full space-y-1.5 text-sm">
          <label htmlFor="alert-metric" className="text-gray-500">
            Metric
          </label>
          <Select
            placeholder="Select a metric"
            value={selectedMetric}
            defaultValue="response.status"
            onValueChange={(values: string) => {
              setSelectedMetric(values);
            }}
            enableClear={false}
          >
            {[
              {
                icon: CodeBracketSquareIcon,
                label: "status",
                value: "response.status",
              },
              {
                icon: CurrencyDollarIcon,
                label: "cost",
                value: "cost",
              },
            ].map((option, idx) => {
              return (
                <SelectItem value={option.value} key={idx} icon={option.icon}>
                  {option.label}
                </SelectItem>
              );
            })}
          </Select>
        </div>
        <div className="col-span-2 w-full space-y-1.5 text-sm ">
          <label
            htmlFor="alert-threshold"
            className="text-gray-500 items-center flex gap-1"
          >
            Threshold
            <Tooltip
              title={
                selectedMetric === "response.status"
                  ? "Specify the percentage at which the alert should be triggered. For instance, entering '10%' will trigger an alert when the metric exceeds 10% of the set value."
                  : "Specify the amount at which the alert should be triggered. For instance, entering '10' will trigger an alert when the metric exceeds $10."
              }
            >
              <InformationCircleIcon className="h-4 w-4 text-gray-500 inline" />
            </Tooltip>
          </label>
          <div className="relative">
            {selectedMetric === "cost" && (
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  $
                </span>
              </div>
            )}
            <input
              type="number"
              name="alert-threshold"
              id="alert-threshold"
              className={clsx(
                selectedMetric === "response.status" && "pr-8",
                selectedMetric === "cost" && "pl-8",
                "block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-gray-100 shadow-sm p-2 text-sm"
              )}
              min={selectedMetric === "response.status" ? 1 : 0.01}
              step={0.01}
              required
            />
            {selectedMetric === "response.status" && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  %
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="col-span-2 w-full space-y-1.5 text-sm">
          <label
            htmlFor="time-frame"
            className="text-gray-500 items-center flex gap-1"
          >
            Time Frame{" "}
            <Tooltip title="Define the time frame over which the metric is evaluated. An alert will be triggered if the threshold is exceeded within this period.">
              <InformationCircleIcon className="h-4 w-4 text-gray-500 inline" />
            </Tooltip>
          </label>
          <Select
            placeholder="Select a time frame"
            value={selectedTimeWindow}
            onValueChange={(values: string) => {
              setSelectedTimeWindow(values);
            }}
            enableClear={false}
          >
            {Object.entries(alertTimeWindows).map(([key, value], idx) => {
              return (
                <SelectItem value={value.toString()} key={idx}>
                  {key}
                </SelectItem>
              );
            })}
          </Select>
        </div>
        <div className="col-span-2 w-full space-y-1.5 text-sm">
          <label
            htmlFor="min-requests"
            className="text-gray-500 items-center flex gap-1"
          >
            Min Requests (optional){" "}
            <Tooltip title="Define this to set a minimum number of requests for this alert to be triggered.">
              <InformationCircleIcon className="h-4 w-4 text-gray-500 inline" />
            </Tooltip>
          </label>
          <input
            type="number"
            name="min-requests"
            id="min-requests"
            className={clsx(
              "block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-gray-100 shadow-sm p-2 text-sm"
            )}
            min={1}
            step={1}
          />
        </div>
        <div className="col-span-4 w-full space-y-1.5 text-sm">
          <label htmlFor="alert-emails" className="text-gray-500">
            Emails
          </label>
          <MultiSelect
            placeholder="Select emails to send alerts to"
            value={selectedEmails}
            onValueChange={(values: string[]) => {
              setSelectedEmails(values);
            }}
          >
            {members.map((member, idx) => {
              return (
                <MultiSelectItem
                  value={member.email}
                  key={idx}
                  className="font-medium text-black"
                >
                  {member.email}
                </MultiSelectItem>
              );
            })}
          </MultiSelect>
        </div>
        <div className="col-span-4 flex justify-end gap-2 pt-4">
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
            Create Alert
          </button>
        </div>
      </form>
    </ThemedModal>
  );
};

export default CreateAlertModal;
