import { FormEvent, useMemo, useState } from "react";
import { useOrg } from "../../layout/organizationContext";
import { useUser } from "@supabase/auth-helpers-react";
import {
  useGetOrgMembers,
  useGetOrgSlackChannels,
  useGetOrgSlackIntegration,
} from "../../../services/hooks/organizations";
import useNotification from "../../shared/notification/useNotification";
import {
  MultiSelect,
  MultiSelectItem,
  Select,
  SelectItem,
} from "@tremor/react";
import {
  CodeBracketSquareIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { clsx } from "../../shared/clsx";
import { alertTimeWindows } from "./alertsPage";
import { Database } from "../../../supabase/database.types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export type AlertRequest = {
  name: string;
  metric: string;
  threshold: number;
  time_window: string;
  emails: string[];
  slack_channels: string[];
  org_id: string;
  minimum_request_count: number | undefined;
};

interface AlertFormProps {
  handleSubmit: (alertReq: AlertRequest) => void;
  onCancel: () => void;
  initialValues?: Database["public"]["Tables"]["alert"]["Row"];
}

const AlertForm = (props: AlertFormProps) => {
  const { handleSubmit, onCancel, initialValues } = props;

  const slackRedirectUrl = useMemo(() => {
    if (window) {
      return `${window.location.origin}/slack/redirect`;
    }
    return null;
  }, []);

  const [selectedMetric, setSelectedMetric] = useState<string>(
    initialValues?.metric || "response.status"
  );
  const [selectedEmails, setSelectedEmails] = useState<string[]>(
    initialValues?.emails || []
  );
  const [selectedSlackChannels, setSelectedSlackChannels] = useState<string[]>(
    initialValues?.slack_channels || []
  );
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>(
    initialValues?.time_window.toString() || ""
  );
  const [showEmails, setShowEmails] = useState<boolean>(
    initialValues ? initialValues.emails.length > 0 : true
  );
  const [showSlackChannels, setShowSlackChannels] = useState<boolean>(
    initialValues ? initialValues.slack_channels.length > 0 : false
  );

  const orgContext = useOrg();
  const user = useUser();

  const { data, isLoading, refetch } = useGetOrgMembers(
    orgContext?.currentOrg?.id || ""
  );

  const { setNotification } = useNotification();

  const members: {
    email: string;
    member: string;
    org_role: string;
  }[] = [...(data || [])];

  const { data: slackIntegration, isLoading: isLoadingSlackIntegration } =
    useGetOrgSlackIntegration(orgContext?.currentOrg?.id || "");

  const { data: slackChannelsData, isLoading: isLoadingSlackChannels } =
    useGetOrgSlackChannels(orgContext?.currentOrg?.id || "");

  const slackChannels: {
    id: string;
    name: string;
  }[] = [...(slackChannelsData || [])];

  const handleCreateAlert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (orgContext?.currentOrg?.id === undefined) {
      return;
    }

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
    if (
      (!showEmails && !showSlackChannels) ||
      (selectedEmails.length < 1 && selectedSlackChannels.length < 1)
    ) {
      setNotification(
        "Please select at least one email or slack channel",
        "error"
      );
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

    handleSubmit({
      name: alertName,
      metric: selectedMetric,
      threshold: alertThreshold,
      time_window: selectedTimeWindow,
      emails: showEmails ? selectedEmails : [],
      slack_channels: showSlackChannels ? selectedSlackChannels : [],
      org_id: orgContext?.currentOrg?.id,
      minimum_request_count: isNaN(alertMinRequests)
        ? undefined
        : alertMinRequests,
    });
  };

  return (
    <form
      onSubmit={handleCreateAlert}
      className="grid grid-cols-4 gap-8 w-full sm:w-[450px] max-w-[450px] h-full"
    >
      <h1 className="col-span-4 font-semibold text-xl text-gray-900 dark:text-gray-100">
        {initialValues ? "Edit Alert" : "Create Alert"}
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
          defaultValue={initialValues?.name || ""}
          placeholder={"Alert Name"}
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
            defaultValue={initialValues?.threshold.toString()}
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
          defaultValue={initialValues?.minimum_request_count?.toString() || "0"}
          min={0}
          step={1}
        />
      </div>

      <div className="col-span-4 w-full p-6 bg-gray-100 rounded-md space-y-1.5">
        <h3 className="text-gray-500 font-semibold">Notify By</h3>
        <div className="col-span-4 w-full space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <label htmlFor="alert-emails" className="text-gray-500">
              Emails
            </label>
            <Switch
              size="md"
              checked={showEmails}
              onCheckedChange={setShowEmails}
            />
          </div>
          {showEmails && (
            <MultiSelect
              placeholder="Select emails to send alerts to"
              value={selectedEmails}
              onValueChange={(values: string[]) => {
                setSelectedEmails(values);
              }}
              className="!mb-8"
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
          )}
        </div>
        <div className="col-span-4 w-full space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <label htmlFor="alert-slack-channels" className="text-gray-500">
              Slack Channels
            </label>
            <Switch
              size="md"
              checked={showSlackChannels}
              onCheckedChange={setShowSlackChannels}
            />
          </div>
          {showSlackChannels &&
            (slackIntegration?.data ? (
              <>
                <MultiSelect
                  placeholder="Select slack channels to send alerts to"
                  value={selectedSlackChannels}
                  onValueChange={(values: string[]) => {
                    setSelectedSlackChannels(values);
                  }}
                >
                  {slackChannels.map((channel, idx) => {
                    return (
                      <MultiSelectItem
                        value={channel.id}
                        key={idx}
                        className="font-medium text-black"
                      >
                        {channel.name}
                      </MultiSelectItem>
                    );
                  })}
                </MultiSelect>
                <small className="text-gray-500">
                  If the channel is private, you will need to add the bot to the
                  channel by mentioning <strong>@Helicone</strong> in the
                  channel.
                </small>
              </>
            ) : (
              <Button asChild variant="outline">
                <a
                  href={`https://slack.com/oauth/v2/authorize?scope=channels:read,groups:read,chat:write,chat:write.public&client_id=${
                    process.env.NEXT_PUBLIC_SLACK_CLIENT_ID ?? ""
                  }&state=${
                    orgContext?.currentOrg?.id || ""
                  }&redirect_uri=https://redirectmeto.com/${slackRedirectUrl}`}
                >
                  Connect Slack
                </a>
              </Button>
            ))}
        </div>
      </div>

      <div className="col-span-4 flex justify-end gap-2 pt-4">
        <button
          onClick={onCancel}
          type="button"
          className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {initialValues ? "Save" : "Create Alert"}
        </button>
      </div>
    </form>
  );
};

export default AlertForm;
