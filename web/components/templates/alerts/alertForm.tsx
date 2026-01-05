import { FormEvent, useMemo, useState, useEffect } from "react";
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
import { BookOpenIcon, BellIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import { alertTimeWindows } from "./constant";
import { Database } from "../../../db/database.types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  CommandSeparator,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, X, ChevronDown } from "lucide-react";
import {
  FilterProvider,
  useFilterAST,
} from "@/filterAST/context/filterContext";
import { useImpersistentFilterStore } from "@/filterAST/store/filterStore";
import FilterASTEditor from "@/filterAST/FilterASTEditor";
import { FilterExpression } from "@helicone-package/filters/types";
import {
  AlertMetric,
  AlertAggregation,
  AlertGrouping,
  ALERT_METRICS,
  ALERT_AGGREGATIONS,
  ALERT_STANDARD_GROUPINGS,
} from "@helicone-package/filters/alerts";
import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "../../../lib/clients/jawn";

export type AlertRequest = {
  name: string;
  metric: AlertMetric;
  threshold: number;
  aggregation: AlertAggregation | null;
  percentile: number | null;
  grouping: AlertGrouping | null;
  grouping_is_property: boolean | null;
  time_window: string;
  emails: string[];
  slack_channels: string[];
  org_id: string;
  minimum_request_count: number | undefined;
  filter: FilterExpression | null;
};

interface AlertFormProps {
  handleSubmit: (alertReq: AlertRequest) => void;
  onCancel: () => void;
  initialValues?: Database["public"]["Tables"]["alert"]["Row"];
}

const AlertFormContent = (props: AlertFormProps) => {
  const { handleSubmit, onCancel, initialValues } = props;
  const { store: filterStore } = useFilterAST();

  const slackRedirectUrl = useMemo(() => {
    if (window) {
      return `${
        window.location.protocol === "http:" ? "https://redirectmeto.com/" : ""
      }${window.location.origin}/slack/redirect`;
    }
    return null;
  }, []);

  const [selectedMetric, setSelectedMetric] = useState<AlertMetric>(
    (initialValues?.metric as AlertMetric) || "response.status",
  );
  const [selectedGrouping, setSelectedGrouping] =
    useState<AlertGrouping | null>(
      ((initialValues as any)?.grouping as string) || null,
    );
  const [selectedAggregation, setSelectedAggregation] =
    useState<AlertAggregation>(
      ((initialValues as any)?.aggregation as AlertAggregation) || "sum",
    );
  const [selectedPercentile, setSelectedPercentile] = useState<string>(
    (initialValues as any)?.percentile?.toString() || "95",
  );
  const [groupingOpen, setGroupingOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(true);
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

  const orgContext = useOrg();

  const { data, isLoading, refetch } = useGetOrgMembers(
    orgContext?.currentOrg?.id || "",
  );

  const properties = useQuery({
    queryKey: ["/v1/property/query", orgContext?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      const res = await jawn.POST("/v1/property/query", {
        body: {},
      });
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  const groupingOptions = useMemo(() => {
    const baseOptions = ALERT_STANDARD_GROUPINGS.map((grouping) => ({
      label: grouping.charAt(0).toUpperCase() + grouping.slice(1),
      value: grouping,
    }));

    const propertyOptions =
      properties.data?.data?.map((property: { property: string }) => ({
        label: property.property,
        value: property.property,
      })) || [];

    return {
      base: baseOptions,
      properties: propertyOptions,
    };
  }, [properties.data]);

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

  useEffect(() => {
    if (initialValues?.filter) {
      filterStore.setFilter(
        initialValues.filter as unknown as FilterExpression,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.filter]);

  // Reset aggregation and percentile when metric is status or count
  useEffect(() => {
    if (selectedMetric === "response.status" || selectedMetric === "count") {
      setSelectedAggregation("sum"); // Reset to default, but we'll show N/A
    }
  }, [selectedMetric]);

  const handleCreateAlert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (orgContext?.currentOrg?.id === undefined) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const alertName = formData.get("alert-name") as string;
    const alertThreshold = Number(formData.get("alert-threshold") as string);
    const alertPercentile = formData.get("alert-percentile") as string;
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

    if (selectedMetric === "count") {
      if (isNaN(alertThreshold) || alertThreshold < 0) {
        setNotification("Please enter a valid threshold", "error");
        return;
      }
    }

    let percentileValue: number | null = null;
    // Only set percentile if aggregation is percentile and metric is not status or count
    if (
      selectedAggregation === "percentile" &&
      selectedMetric !== "response.status" &&
      selectedMetric !== "count"
    ) {
      if (!alertPercentile || alertPercentile.trim() === "") {
        setNotification(
          "Please enter a percentile value when using percentile aggregation",
          "error",
        );
        return;
      }
      const percentileNum = Number(alertPercentile);
      if (isNaN(percentileNum) || percentileNum < 0 || percentileNum > 99.9) {
        setNotification("Please enter a valid percentile (0-99.9)", "error");
        return;
      }
      percentileValue = percentileNum;
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

    if (!selectedMetric) {
      setNotification("Please select a metric", "error");
      return;
    }

    if (selectedTimeWindow === "") {
      setNotification("Please select a time window", "error");
      return;
    }

    const groupingIsProperty = selectedGrouping
      ? groupingOptions.properties.some(
          (prop) => prop.value === selectedGrouping,
        )
      : null;

    handleSubmit({
      name: alertName,
      metric: selectedMetric,
      threshold: alertThreshold,
      aggregation:
        selectedMetric === "response.status" || selectedMetric === "count"
          ? null
          : selectedAggregation,
      percentile:
        selectedMetric === "response.status" || selectedMetric === "count"
          ? null
          : percentileValue,
      grouping: selectedGrouping,
      grouping_is_property: groupingIsProperty,
      time_window: selectedTimeWindow,
      emails: showEmails ? selectedEmails : [],
      slack_channels: showSlackChannels ? selectedSlackChannels : [],
      org_id: orgContext?.currentOrg?.id,
      minimum_request_count: isNaN(alertMinRequests)
        ? undefined
        : alertMinRequests,
      filter: filterStore.filter,
    });
  };

  return (
    <form
      onSubmit={handleCreateAlert}
      className="flex max-h-[80vh] w-full max-w-[600px] flex-col sm:w-[600px]"
    >
      <div className="flex flex-shrink-0 items-center pb-4">
        <div className="flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {initialValues ? "Edit Alert" : "Create Alert"}
          </h1>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-sm border border-border px-4 py-4">
        <div className="flex flex-col gap-6">
          {/* Alert Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="alert-name"
              className="text-sm text-gray-500 dark:text-gray-200"
            >
              Alert Name
            </label>
            <Input
              type="text"
              name="alert-name"
              id="alert-name"
              required
              defaultValue={initialValues?.name || ""}
              placeholder="My Alert"
            />
          </div>

          {/* Alert Condition */}
          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <span className="whitespace-nowrap text-muted-foreground">
                When
              </span>
              <Select
                value={selectedMetric}
                defaultValue="response.status"
                onValueChange={(values: string) => {
                  setSelectedMetric(values as AlertMetric);
                }}
              >
                <SelectTrigger className="h-9 w-[160px] rounded-none border-0 border-b border-border bg-transparent px-2 text-foreground shadow-none focus:border-foreground focus:ring-0">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_METRICS.map((metric) => {
                    const metricLabels: Record<AlertMetric, string> = {
                      "response.status": "Error Rate",
                      cost: "Cost",
                      latency: "Latency",
                      total_tokens: "Total Tokens",
                      prompt_tokens: "Prompt Tokens",
                      completion_tokens: "Completion Tokens",
                      prompt_cache_read_tokens: "Prompt Cache Read Tokens",
                      prompt_cache_write_tokens: "Prompt Cache Write Tokens",
                      count: "Count",
                    };

                    return (
                      <SelectItem value={metric} key={metric}>
                        {metricLabels[metric]}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <span className="whitespace-nowrap text-muted-foreground">
                is above
              </span>
              <div className="relative">
                {selectedMetric === "cost" && (
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-sm text-gray-500">$</span>
                  </div>
                )}
                <Input
                  type="number"
                  name="alert-threshold"
                  id="alert-threshold"
                  className={clsx(
                    "h-9 w-20 rounded-none border-0 border-b border-border bg-transparent px-2 text-center focus-visible:border-foreground focus-visible:ring-0",
                    selectedMetric === "response.status" && "pr-8",
                    selectedMetric === "cost" && "pl-7",
                    selectedMetric === "latency" && "pr-10",
                  )}
                  min={selectedMetric === "response.status" ? 1 : 0.01}
                  defaultValue={initialValues?.threshold.toString()}
                  step={0.01}
                  required
                />
                {selectedMetric === "response.status" && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                )}
                {selectedMetric === "latency" && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm text-gray-500">ms</span>
                  </div>
                )}
              </div>
              <span className="whitespace-nowrap text-muted-foreground">
                for
              </span>
              <Select
                value={selectedTimeWindow}
                onValueChange={(values: string) => {
                  setSelectedTimeWindow(values);
                }}
              >
                <SelectTrigger className="h-9 w-[120px] rounded-none border-0 border-b border-border bg-transparent px-2 text-foreground shadow-none focus:border-foreground focus:ring-0">
                  <SelectValue placeholder="Time" />
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

            {selectedMetric !== "response.status" &&
              selectedMetric !== "count" && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  <span className="whitespace-nowrap text-muted-foreground">
                    using
                  </span>
                  <Select
                    value={selectedAggregation}
                    onValueChange={(value) =>
                      setSelectedAggregation(value as AlertAggregation)
                    }
                  >
                    <SelectTrigger className="h-9 w-[120px] rounded-none border-0 border-b border-border bg-transparent px-2 text-foreground shadow-none focus:border-foreground focus:ring-0">
                      <SelectValue placeholder="Aggregation" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALERT_AGGREGATIONS.map((agg) => (
                        <SelectItem key={agg} value={agg}>
                          {agg.charAt(0).toUpperCase() + agg.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="whitespace-nowrap text-muted-foreground">
                    aggregation
                  </span>
                  {selectedAggregation === "percentile" && (
                    <>
                      <span className="whitespace-nowrap text-muted-foreground">
                        at
                      </span>
                      <Select
                        value={selectedPercentile}
                        onValueChange={setSelectedPercentile}
                      >
                        <SelectTrigger className="h-9 w-[80px] rounded-none border-0 border-b border-border bg-transparent px-2 text-foreground shadow-none focus:border-foreground focus:ring-0">
                          <SelectValue placeholder="95th" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50th</SelectItem>
                          <SelectItem value="75">75th</SelectItem>
                          <SelectItem value="90">90th</SelectItem>
                          <SelectItem value="95">95th</SelectItem>
                          <SelectItem value="99">99th</SelectItem>
                          <SelectItem value="99.9">99.9th</SelectItem>
                        </SelectContent>
                      </Select>
                      <input
                        type="hidden"
                        name="alert-percentile"
                        id="alert-percentile"
                        value={selectedPercentile}
                      />
                      <span className="whitespace-nowrap text-muted-foreground">
                        percentile
                      </span>
                    </>
                  )}
                </div>
              )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <span className="whitespace-nowrap text-muted-foreground">
                grouped by
              </span>
              <Popover open={groupingOpen} onOpenChange={setGroupingOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={groupingOpen}
                    className="h-9 w-[160px] justify-between rounded-none border-0 border-b border-border bg-transparent px-2 font-normal text-foreground shadow-none hover:border-foreground hover:bg-transparent focus:border-foreground focus:ring-0"
                  >
                    {selectedGrouping
                      ? groupingOptions.base.find(
                          (opt) => opt.value === selectedGrouping,
                        )?.label ||
                        groupingOptions.properties.find(
                          (opt) => opt.value === selectedGrouping,
                        )?.label ||
                        selectedGrouping
                      : "None"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search..." className="h-9" />
                    <CommandEmpty>No grouping found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup heading="Standard">
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setSelectedGrouping(null);
                            setGroupingOpen(false);
                          }}
                        >
                          <Check
                            className={clsx(
                              "mr-2 h-4 w-4",
                              !selectedGrouping ? "opacity-100" : "opacity-0",
                            )}
                          />
                          None
                        </CommandItem>
                        {groupingOptions.base.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => {
                              setSelectedGrouping(option.value);
                              setGroupingOpen(false);
                            }}
                          >
                            <Check
                              className={clsx(
                                "mr-2 h-4 w-4",
                                selectedGrouping === option.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {groupingOptions.properties.length > 0 && (
                        <>
                          <CommandSeparator />
                          <CommandGroup heading="Custom Properties">
                            {groupingOptions.properties.map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                  setSelectedGrouping(option.value);
                                  setGroupingOpen(false);
                                }}
                              >
                                <Check
                                  className={clsx(
                                    "mr-2 h-4 w-4",
                                    selectedGrouping === option.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {option.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground">filtered by</span>
              <FilterASTEditor showTitle={false} />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <span className="whitespace-nowrap text-muted-foreground">
                with at least
              </span>
              <Input
                type="number"
                name="min-requests"
                id="min-requests"
                className="h-9 w-20 rounded-none border-0 border-b border-border bg-transparent px-2 text-center focus-visible:border-foreground focus-visible:ring-0"
                defaultValue={
                  initialValues?.minimum_request_count?.toString() || "0"
                }
                min={0}
                step={1}
              />
              <span className="whitespace-nowrap text-muted-foreground">
                requests
              </span>
            </div>
          </div>

          {/* Notification */}
          <div className="w-full space-y-3 rounded-md border border-border bg-background/80 px-4 pb-3 pt-2">
            <Collapsible
              open={notificationOpen}
              onOpenChange={setNotificationOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full items-center justify-between p-0 text-base font-semibold text-gray-900 hover:bg-transparent dark:text-gray-100"
                >
                  <span className="text-base font-semibold">Notification</span>
                  <ChevronDown
                    className={clsx(
                      "h-4 w-4 transition-transform",
                      notificationOpen && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="grid grid-cols-4 gap-4 pb-0">
                <div className="col-span-4 mt-4 w-full space-y-1.5 text-sm">
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
                              <span className="max-w-[200px] truncate">
                                {email}
                              </span>
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
                            <PopoverContent
                              className="w-[300px] p-0"
                              align="start"
                            >
                              <Command>
                                <CommandInput placeholder="Search channels..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No channels found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {slackChannels.map((channel) => (
                                      <CommandItem
                                        key={channel.id}
                                        onSelect={() => {
                                          const channelId = channel.id;
                                          setSelectedSlackChannels((prev) =>
                                            prev.includes(channelId)
                                              ? prev.filter(
                                                  (c) => c !== channelId,
                                                )
                                              : [...prev, channelId],
                                          );
                                        }}
                                        value={channel.name}
                                      >
                                        <Check
                                          className={clsx(
                                            "mr-2 h-4 w-4",
                                            selectedSlackChannels.includes(
                                              channel.id,
                                            )
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
                          If the channel is private, you will need to add the
                          bot to the channel by mentioning{" "}
                          <strong>@Helicone</strong> in the channel.
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
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2 pb-0 pt-4">
        <Button
          type="button"
          variant="link"
          size="default"
          asChild
          className="pl-2 text-muted-foreground hover:text-foreground"
        >
          <a
            href="https://docs.helicone.ai/features/alerts"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <BookOpenIcon className="h-4 w-4" />
            <span>View Docs</span>
          </a>
        </Button>
        <div className="flex gap-2">
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
      </div>
    </form>
  );
};

// to provider isolated filter store for alerts
const AlertForm = (props: AlertFormProps) => {
  const impersistentFilterStore = useImpersistentFilterStore();

  return (
    <FilterProvider store={impersistentFilterStore}>
      <AlertFormContent {...props} />
    </FilterProvider>
  );
};

export default AlertForm;
