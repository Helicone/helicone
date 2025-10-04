import ThemedModal from "../../shared/themed/themedModal";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { MultiSelect, MultiSelectItem } from "@tremor/react";
import { useOrg } from "@/components/layout/org/organizationContext";
import {
  useGetOrgMembers,
  useGetOrgSlackChannels,
  useGetOrgSlackIntegration,
} from "@/services/hooks/organizations";
import { Button } from "@/components/ui/button";
import { getHeliconeCookie } from "@/lib/cookies";
import useNotification from "@/components/shared/notification/useNotification";
import { Integration } from "@/services/hooks/useIntegrations";

interface ReportsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  report?: Integration | null;
  refetchReport: () => void;
}

const ReportsModal = (props: ReportsModalProps) => {
  const { open, setOpen, report, refetchReport } = props;

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

  const { data, _isLoading, _refetch } = useGetOrgMembers(
    orgContext?.currentOrg?.id || "",
  );

  const members: {
    email: string;
    member: string;
    org_role: string;
  }[] = [...(data || [])];

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
    setShowEmails(
      report?.active ? (report?.settings?.emails as string[]).length > 0 : true,
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
  }, [
    open,
    report?.active,
    report?.settings?.emails,
    report?.settings?.slack_channels,
  ]);

  const { data: slackIntegration, isLoading: _isLoadingSlackIntegration } =
    useGetOrgSlackIntegration(orgContext?.currentOrg?.id || "");

  const { data: slackChannelsData, isLoading: _isLoadingSlackChannels } =
    useGetOrgSlackChannels(orgContext?.currentOrg?.id || "");

  const slackChannels: {
    id: string;
    name: string;
  }[] = [...(slackChannelsData?.data || [])];

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
      setOpen(false);
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
    setOpen(false);
    refetchReport();
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <form
        onSubmit={handleCustomizeReports}
        className="grid h-full w-full max-w-[450px] grid-cols-4 gap-2 sm:w-[450px]"
      >
        <div className="col-span-4 flex flex-row items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {reportEnabled ? "Customize Reports" : "Enable Reports"}
          </h1>

          <Switch
            checked={reportEnabled}
            onCheckedChange={setReportEnabled}
            size="md"
          />
        </div>
        <small className="col-span-4 text-gray-500">
          Receive a weekly summary report every <strong>Monday</strong> at{" "}
          <strong>10am UTC</strong>.
        </small>
        {reportEnabled && (
          <div className="col-span-4 w-full space-y-1.5 rounded-md bg-gray-100 p-6">
            <h3 className="font-semibold text-gray-500">Notify By</h3>
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
              setOpen(false);
            }}
            type="button"
            className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Save
          </button>
        </div>
      </form>
    </ThemedModal>
  );
};

export default ReportsModal;
