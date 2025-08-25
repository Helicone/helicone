import { FormEvent, useMemo, useState } from "react";
import { useOrg } from "../../layout/org/organizationContext";
import {
  useGetOrgMembers,
  useGetOrgSlackChannels,
  useGetOrgSlackIntegration,
} from "../../../services/hooks/organizations";
import useNotification from "../../shared/notification/useNotification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { clsx } from "../../shared/clsx";
import { alertTimeWindows } from "./constant";
import { Database } from "../../../db/database.types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import AggregationBuilder, { AggregationConfig } from "./AggregationBuilder";
import {
  AggregationExpression,
  FilterExpression,
} from "@helicone-package/filters";
export type AlertRequest = {
  name: string;
  threshold: number;
  time_window: string;
  emails: string[];
  slack_channels: string[];
  org_id: string;
  minimum_request_count: number | undefined;
  filter?: FilterExpression | null; // FilterAST expression for conditional alerts
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
      return `${
        window.location.protocol === "http:" ? "https://redirectmeto.com/" : ""
      }${window.location.origin}/slack/redirect`;
    }
    return null;
  }, []);

  const [selectedEmails, setSelectedEmails] = useState<string[]>(
    initialValues?.emails || [],
  );
  const [selectedSlackChannels, setSelectedSlackChannels] = useState<string[]>(
    initialValues?.slack_channels || [],
  );
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>(
    initialValues?.time_window.toString() || "",
  );
  const [showEmails, setShowEmails] = useState<boolean>(
    initialValues ? initialValues.emails.length > 0 : true,
  );
  const [showSlackChannels, setShowSlackChannels] = useState<boolean>(
    initialValues ? initialValues.slack_channels.length > 0 : false,
  );
  const [aggregationConfig, setAggregationConfig] = useState<AggregationConfig>(
    {
      field: "latency",
      function: "p95",
      comparison: "gt",
      threshold: 0,
      whereFilter: null,
    },
  );

  const orgContext = useOrg();

  const { data, isLoading, refetch } = useGetOrgMembers(
    orgContext?.currentOrg?.id || "",
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
  }[] = [...(slackChannelsData?.data || [])];

  const handleCreateAlert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (orgContext?.currentOrg?.id === undefined) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const alertName = formData.get("alert-name") as string;
    const alertThreshold = aggregationConfig.threshold;
    const alertMinRequests = Number(formData.get("min-requests") as string);

    if (isNaN(alertThreshold) || alertThreshold <= 0) {
      setNotification(
        "Please enter a valid threshold for the aggregation",
        "error",
      );
      return;
    }
    if (
      (!showEmails && !showSlackChannels) ||
      (selectedEmails.length < 1 && selectedSlackChannels.length < 1)
    ) {
      setNotification(
        "Please select at least one email or slack channel",
        "error",
      );
      return;
    }

    if (selectedTimeWindow === "") {
      setNotification("Please select a time window", "error");
      return;
    }

    // All alerts now use aggregation configuration
    const aggregationFilter: AggregationExpression = {
      type: "aggregation",
      field: {
        request_response_rmt: {
          [aggregationConfig.field]: {
            gte: 0, // Dummy operator for FilterLeaf structure
          },
        },
      },
      function: aggregationConfig.function as AggregationExpression["function"],
      comparison:
        aggregationConfig.comparison as AggregationExpression["comparison"],
      threshold: aggregationConfig.threshold,
      where: aggregationConfig.whereFilter || undefined,
    };

    handleSubmit({
      name: alertName,
      threshold: alertThreshold,
      time_window: selectedTimeWindow,
      emails: showEmails ? selectedEmails : [],
      slack_channels: showSlackChannels ? selectedSlackChannels : [],
      org_id: orgContext?.currentOrg?.id,
      minimum_request_count: isNaN(alertMinRequests)
        ? undefined
        : alertMinRequests,
      filter: aggregationFilter,
    });
  };

  return (
    <form
      onSubmit={handleCreateAlert}
      className="grid h-full w-full max-w-[450px] grid-cols-4 gap-8 sm:w-[450px]"
    >
      <h1 className="col-span-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        {initialValues ? "Edit Alert" : "Create Alert"}
      </h1>
      <div className="col-span-4 w-full space-y-1.5 text-sm">
        <label
          htmlFor="alert-name"
          className="text-gray-500 dark:text-gray-200"
        >
          Name
        </label>
        <Input
          type="text"
          name="alert-name"
          id="alert-name"
          required
          defaultValue={initialValues?.name || ""}
          placeholder="Alert Name"
        />
      </div>

      <div className="col-span-4 w-full space-y-1.5">
        <AggregationBuilder
          value={aggregationConfig}
          onChange={setAggregationConfig}
        />
      </div>
      <div className="col-span-2 w-full space-y-1.5 text-sm">
        <label
          htmlFor="time-frame"
          className="flex items-center gap-1 text-gray-500 dark:text-gray-200"
        >
          Time Frame{" "}
          <Tooltip title="Define the time frame over which the metric is evaluated. An alert will be triggered if the threshold is exceeded within this period.">
            <InformationCircleIcon className="inline h-4 w-4 text-gray-500" />
          </Tooltip>
        </label>
        <Select
          value={selectedTimeWindow}
          onValueChange={(values: string) => {
            setSelectedTimeWindow(values);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a time frame" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(alertTimeWindows).map(([key, value], idx) => {
              return (
                <SelectItem value={value.toString()} key={idx}>
                  {key}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 w-full space-y-1.5 text-sm">
        <label
          htmlFor="min-requests"
          className="flex items-center gap-1 text-gray-500 dark:text-gray-200"
        >
          Min Requests (optional){" "}
          <Tooltip title="Define this to set a minimum number of requests for this alert to be triggered.">
            <InformationCircleIcon className="inline h-4 w-4 text-gray-500" />
          </Tooltip>
        </label>
        <Input
          type="number"
          name="min-requests"
          id="min-requests"
          defaultValue={initialValues?.minimum_request_count?.toString() || "0"}
          min={0}
          step={1}
        />
      </div>

      <div className="col-span-4 w-full space-y-1.5 rounded-md bg-gray-100 p-6 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-500">Notify By</h3>
        <div className="col-span-4 w-full space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <label
              htmlFor="alert-emails"
              className="text-gray-500 dark:text-gray-200"
            >
              Emails
            </label>
            <Switch
              size="md"
              checked={showEmails}
              onCheckedChange={setShowEmails}
            />
          </div>
          {showEmails && (
            <div className="space-y-2">
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    size="sm"
                  >
                    <span className="truncate">
                      {selectedEmails.length > 0
                        ? `${selectedEmails.length} email${selectedEmails.length > 1 ? "s" : ""} selected`
                        : "Select emails to send alerts to"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search emails..." />
                    <CommandList>
                      <CommandEmpty>No emails found.</CommandEmpty>
                      <CommandGroup>
                        {members.map((member) => (
                          <CommandItem
                            key={member.email}
                            onSelect={() => {
                              const email = member.email;
                              setSelectedEmails((prev) =>
                                prev.includes(email)
                                  ? prev.filter((e) => e !== email)
                                  : [...prev, email],
                              );
                            }}
                            value={member.email}
                          >
                            <Check
                              className={clsx(
                                "mr-2 h-4 w-4",
                                selectedEmails.includes(member.email)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {member.email}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedEmails.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                    >
                      <span className="max-w-[200px] truncate">{email}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEmails((prev) =>
                            prev.filter((e) => e !== email),
                          )
                        }
                        className="ml-1 rounded-sm hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="col-span-4 w-full space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <label
              htmlFor="alert-slack-channels"
              className="text-gray-500 dark:text-gray-200"
            >
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
                <div className="space-y-2">
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        size="sm"
                      >
                        <span className="truncate">
                          {selectedSlackChannels.length > 0
                            ? `${selectedSlackChannels.length} channel${selectedSlackChannels.length > 1 ? "s" : ""} selected`
                            : "Select slack channels to send alerts to"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search channels..." />
                        <CommandList>
                          <CommandEmpty>No channels found.</CommandEmpty>
                          <CommandGroup>
                            {slackChannels.map((channel) => (
                              <CommandItem
                                key={channel.id}
                                onSelect={() => {
                                  const channelId = channel.id;
                                  setSelectedSlackChannels((prev) =>
                                    prev.includes(channelId)
                                      ? prev.filter((c) => c !== channelId)
                                      : [...prev, channelId],
                                  );
                                }}
                                value={channel.name}
                              >
                                <Check
                                  className={clsx(
                                    "mr-2 h-4 w-4",
                                    selectedSlackChannels.includes(channel.id)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {channel.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedSlackChannels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedSlackChannels.map((channelId) => {
                        const channel = slackChannels.find(
                          (c) => c.id === channelId,
                        );
                        return channel ? (
                          <div
                            key={channelId}
                            className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                          >
                            <span className="max-w-[200px] truncate">
                              {channel.name}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedSlackChannels((prev) =>
                                  prev.filter((c) => c !== channelId),
                                )
                              }
                              className="ml-1 rounded-sm hover:bg-muted-foreground/20"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
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
                  }&redirect_uri=${slackRedirectUrl}`}
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
          className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          {initialValues ? "Save" : "Create Alert"}
        </button>
      </div>
    </form>
  );
};

export default AlertForm;
