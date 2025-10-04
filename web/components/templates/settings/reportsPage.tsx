import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { getHeliconeCookie } from "@/lib/cookies";
import { useGetReport } from "@/services/hooks/dashboard";
import {
  useGetOrgMembers,
  useGetOrgSlackChannels,
  useGetOrgSlackIntegration,
} from "@/services/hooks/organizations";
import { FormEvent, useEffect, useMemo, useState } from "react";
import useNotification from "../../shared/notification/useNotification";
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
import { clsx } from "../../shared/clsx";

const ReportsPage = () => {
  const {
    data: report,
    isLoading: isLoadingReport,
    refetch: refetchReport,
    isRefetching: isRefetchingReport,
  } = useGetReport();

  const slackRedirectUrl = useMemo(() => {
    if (typeof window !== "undefined" && window) {
      return `${
        window.location.protocol === "http:" ? "https://redirectmeto.com/" : ""
      }${window.location.origin}/slack/redirect`;
    }
    return null;
  }, []);

  const jawn = useJawnClient();

  const orgContext = useOrg();
  const { setNotification } = useNotification();

  const { data, isLoading } = useGetOrgMembers(
    orgContext?.currentOrg?.id || "",
  );

  const members: {
    email: string;
    member: string;
    org_role: string;
  }[] = [...(data || [])];

  const { data: slackIntegration } = useGetOrgSlackIntegration(
    orgContext?.currentOrg?.id || "",
  );

  const { data: slackChannelsData, isLoading: isLoadingSlackChannels } =
    useGetOrgSlackChannels(orgContext?.currentOrg?.id || "");

  const slackChannels: {
    id: string;
    name: string;
  }[] = [...(slackChannelsData?.data || [])];

  const [reportEnabled, setReportEnabled] = useState<boolean>(
    report?.active ? report?.active : false,
  );
  const [selectedEmails, setSelectedEmails] = useState<string[]>(
    (report?.settings?.emails as string[]) || [],
  );
  const [selectedSlackChannels, setSelectedSlackChannels] = useState<string[]>(
    (report?.settings?.slack_channels as string[]) || [],
  );

  const [showEmails, setShowEmails] = useState<boolean>(
    report?.active ? (report?.settings?.emails as string[]).length > 0 : true,
  );

  const [showSlackChannels, setShowSlackChannels] = useState<boolean>(
    report?.active
      ? (report?.settings?.slack_channels as string[]).length > 0
      : false,
  );

  useEffect(() => {
    if (!isLoadingReport && !isRefetchingReport) {
      setShowEmails(
        report?.active
          ? (report?.settings?.emails as string[]).length > 0
          : true,
      );
      setShowSlackChannels(
        report?.active
          ? (report?.settings?.slack_channels as string[]).length > 0
          : false,
      );
      setSelectedEmails(
        report?.active ? (report?.settings?.emails as string[]) : [],
      );
      setSelectedSlackChannels(
        report?.active ? (report?.settings?.slack_channels as string[]) : [],
      );
      setReportEnabled(report?.active ?? false);
    }
  }, [
    isLoadingReport,
    isRefetchingReport,
    report?.active,
    report?.settings?.emails,
    report?.settings?.slack_channels,
  ]);

  // useEffect(() => {
  //   setShowEmails(
  //     report?.active ? (report?.settings?.emails as string[]).length > 0 : true
  //   );
  //   setShowSlackChannels(
  //     report?.active
  //       ? (report?.settings?.slack_channels as string[]).length > 0
  //       : false
  //   );
  //   setSelectedEmails(
  //     report?.active ? (report?.settings?.emails as string[]) : []
  //   );
  //   setSelectedSlackChannels(
  //     report?.active ? (report?.settings?.slack_channels as string[]) : []
  //   );
  // }, []);

  const handleCustomizeReports = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (orgContext?.currentOrg?.id === undefined) {
      return;
    }

    if (
      reportEnabled &&
      ((!showEmails && !showSlackChannels) ||
        (selectedEmails.length < 1 && selectedSlackChannels.length < 1))
    ) {
      setNotification(
        "Please select at least one email or slack channel",
        "error",
      );
      return;
    }

    const authFromCookie = getHeliconeCookie();
    if (authFromCookie.error || !authFromCookie.data) {
      setNotification("Please login to create an alert", "error");
      return;
    }

    const req_body = {
      integration_name: "report",
      settings: reportEnabled
        ? {
            emails: showEmails ? selectedEmails : [],
            slack_channels: showSlackChannels ? selectedSlackChannels : [],
          }
        : report?.settings
          ? report?.settings
          : {},
      active: reportEnabled,
    };

    if (report?.id) {
      const { error } = await jawn.POST(`/v1/integration/{integrationId}`, {
        params: {
          path: {
            integrationId: report.id,
          },
        },
        body: req_body,
      });

      if (error) {
        setNotification(`Failed to update report ${error}`, "error");
        return;
      }

      setNotification("Successfully configured report", "success");
      refetchReport();
      return;
    }

    const { error } = await jawn.POST("/v1/integration", {
      body: req_body,
    });

    if (error) {
      setNotification(`Failed to create report ${error}`, "error");
      return;
    }

    setNotification("Successfully enabled report", "success");
    refetchReport();
  };

  return (
    <div className="p-4">
      <form onSubmit={handleCustomizeReports} className="h-full w-full">
        <div className="col-span-4 flex flex-row items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Reports
          </h1>

          <Switch
            checked={reportEnabled}
            onCheckedChange={setReportEnabled}
            size="md"
          />
        </div>
        <small className="col-span-4">
          Receive a weekly summary report every <strong>Monday</strong> at{" "}
          <strong>10am UTC</strong>.
        </small>
        {reportEnabled && (
          <div className="col-span-4 w-full space-y-1.5 rounded-md bg-card p-6">
            {/* <h3 className="font-semibold">Notify By</h3> */}
            <div className="col-span-4 w-full space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <label htmlFor="alert-emails" className="text-gray-500">
                  Emails
                </label>
                <Switch
                  disabled={isLoading}
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
                        className="mb-2 w-full justify-between"
                        size="sm"
                        disabled={isLoading}
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
                <label htmlFor="alert-slack-channels" className="text-gray-500">
                  Slack Channels
                </label>
                <Switch
                  disabled={isLoadingSlackChannels}
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
                            disabled={isLoadingSlackChannels}
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
                      If the channel is private, you will need to add the bot to
                      the channel by mentioning <strong>@Helicone</strong> in
                      the channel.
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
        )}
        <div className="col-span-4 flex justify-end gap-2 pt-4">
          <Button
            onClick={() => {
              setSelectedEmails([]);
              setSelectedSlackChannels([]);
            }}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
};

export default ReportsPage;
