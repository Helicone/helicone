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
import { MultiSelect, MultiSelectItem } from "@tremor/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import useNotification from "../../shared/notification/useNotification";

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

  const { data, isLoading, refetch } = useGetOrgMembers(
    orgContext?.currentOrg?.id || ""
  );

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

  const [reportEnabled, setReportEnabled] = useState<boolean>(
    report?.active ? report?.active : false
  );
  const [selectedEmails, setSelectedEmails] = useState<string[]>(
    (report?.settings?.emails as string[]) || []
  );
  const [selectedSlackChannels, setSelectedSlackChannels] = useState<string[]>(
    (report?.settings?.slack_channels as string[]) || []
  );

  const [showEmails, setShowEmails] = useState<boolean>(
    report?.active ? (report?.settings?.emails as string[]).length > 0 : true
  );

  const [showSlackChannels, setShowSlackChannels] = useState<boolean>(
    report?.active
      ? (report?.settings?.slack_channels as string[]).length > 0
      : false
  );

  useEffect(() => {
    if (!isLoadingReport && !isRefetchingReport) {
      setShowEmails(
        report?.active
          ? (report?.settings?.emails as string[]).length > 0
          : true
      );
      setShowSlackChannels(
        report?.active
          ? (report?.settings?.slack_channels as string[]).length > 0
          : false
      );
      setSelectedEmails(
        report?.active ? (report?.settings?.emails as string[]) : []
      );
      setSelectedSlackChannels(
        report?.active ? (report?.settings?.slack_channels as string[]) : []
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
        "error"
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
    <div className="max-w-2xl">
      <form onSubmit={handleCustomizeReports} className="w-full h-full">
        <div className="col-span-4 flex flex-row justify-between items-center">
          <h1 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
            Reports
          </h1>

          <Switch
            checked={reportEnabled}
            onCheckedChange={setReportEnabled}
            size="md"
          />
        </div>
        <small className="text-gray-500 col-span-4">
          Receive a weekly summary report every <strong>Monday</strong> at{" "}
          <strong>10am UTC</strong>.
        </small>
        {reportEnabled && (
          <div className="col-span-4 w-full p-6 bg-gray-100 rounded-md space-y-1.5">
            <h3 className="text-gray-500 font-semibold">Notify By</h3>
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
                <MultiSelect
                  disabled={isLoading}
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
                  disabled={isLoadingSlackChannels}
                  size="md"
                  checked={showSlackChannels}
                  onCheckedChange={setShowSlackChannels}
                />
              </div>
              {showSlackChannels &&
                (slackIntegration?.data ? (
                  <>
                    <MultiSelect
                      disabled={isLoadingSlackChannels}
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
          <button
            onClick={() => {
              setSelectedEmails([]);
              setSelectedSlackChannels([]);
            }}
            type="button"
            className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportsPage;
