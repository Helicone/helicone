import { useState } from "react";
import { useOrg } from "../../layout/org/organizationContext";
import useAlertsPage from "./useAlertsPage";
import { CreateAlertModal, EditAlertModal } from "./createAlertModal";
import DeleteAlertModal from "./deleteAlertModal";
import ThemedTable from "../../shared/themed/themedTable";
import { Database } from "../../../db/database.types";
import { getUSDate } from "../../shared/utils/utils";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { useGetOrgSlackChannels } from "@/services/hooks/organizations";
import { alertTimeWindows } from "./constant";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import "@/styles/settings-tables.css";
import { SettingsContainer } from "@/components/ui/settings-container";
import "@/styles/settings.css";
import { AlertMetric } from "@helicone-package/filters/alerts";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

const AlertsPage = () => {
  const [createNewAlertModal, setCreateNewAlertModal] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [editAlertOpen, setEditAlertOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] =
    useState<Database["public"]["Tables"]["alert"]["Row"]>();
  const orgContext = useOrg();

  const { alertHistory, alerts, isLoading, refetch } = useAlertsPage(
    orgContext?.currentOrg?.id || "",
  );

  const { data: slackChannelsData, isLoading: isLoadingSlackChannels } =
    useGetOrgSlackChannels(orgContext?.currentOrg?.id || "");

  const slackChannels: {
    id: string;
    name: string;
  }[] = [...(slackChannelsData?.data || [])];
  // Free tier limit checks
  const alertCount = alerts?.length || 0;
  const { canCreate: canCreateAlert, freeLimit: MAX_ALERTS } = useFeatureLimit(
    "alerts",
    alertCount,
  );

  const isOrgLoading = !orgContext || !orgContext.currentOrg;
  const isPageLoading = isLoading || isLoadingSlackChannels || isOrgLoading;

  function formatTimeWindow(milliseconds: number): string {
    let closest = Object.keys(alertTimeWindows).reduce((a, b) => {
      return Math.abs(alertTimeWindows[a] - milliseconds) <
        Math.abs(alertTimeWindows[b] - milliseconds)
        ? a
        : b;
    });

    return closest;
  }

  function formatThreshold(metric: string, threshold: number): string {
    if (metric === "response.status") {
      return `${threshold}%`;
    }
    if (metric === "cost") {
      return `$${Number(threshold).toFixed(2)}`;
    }
    // For all other metrics (latency, tokens, count), just show the number
    return threshold.toString();
  }

  function formatAggregation(
    metric: string,
    aggregation: string | null,
  ): string {
    if (metric === "response.status") {
      return "rate";
    }
    if (metric === "count") {
      return "count";
    }
    return aggregation || "sum";
  }

  function formatMetric(metric: string): string {
    const metricLabels: Record<AlertMetric, string> = {
      "response.status": "Status",
      cost: "Cost",
      latency: "Latency (ms)",
      total_tokens: "Total Tokens",
      prompt_tokens: "Prompt Tokens",
      completion_tokens: "Completion Tokens",
      prompt_cache_read_tokens: "Prompt Cache Read Tokens",
      prompt_cache_write_tokens: "Prompt Cache Write Tokens",
      count: "Count",
    };
    return metricLabels[metric as AlertMetric] || metric;
  }

  const handleCreateAlert = () => {
    setCreateNewAlertModal(true);
  };

  if (!isPageLoading && alertCount === 0) {
    return (
      <div className="flex h-screen w-full flex-col bg-background dark:bg-sidebar-background">
        <div className="flex h-full flex-1">
          <EmptyStateCard feature="alerts" onPrimaryClick={handleCreateAlert} />
        </div>
        <CreateAlertModal
          open={createNewAlertModal}
          setOpen={setCreateNewAlertModal}
          onSuccess={() => refetch()}
        />
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <LoadingAnimation height={175} width={175} title="Loading alerts..." />
      </div>
    );
  }

  return (
    <SettingsContainer className="!max-w-full">
      {!canCreateAlert && (
        <div className="border-b border-border p-4">
          <FreeTierLimitBanner
            feature="alerts"
            itemCount={alertCount}
            freeLimit={MAX_ALERTS}
          />
        </div>
      )}

      {/* Active Alerts Section */}
      <div className="border-b border-border p-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold">Alerts</h1>
          </div>

          <div className="flex flex-col items-end gap-1">
            <FreeTierLimitWrapper feature="alerts" itemCount={alertCount}>
              <Button
                variant="default"
                size="sm"
                className="text-xs"
                onClick={handleCreateAlert}
              >
                <PlusIcon className="mr-1 h-4 w-4" />
                Create
              </Button>
            </FreeTierLimitWrapper>
          </div>
        </div>
      </div>

      <div className="border-b border-border overflow-x-auto">
        <div className="settings-table border-t border-border min-w-[1200px]">
          <ThemedTable
            columns={[
              { name: "Actions", key: "actions", hidden: false },
              { name: "Name", key: "key_name", hidden: false },
              { name: "Status", key: "status", hidden: false },
              { name: "Created", key: "created_at", hidden: false },
              { name: "Metric", key: "metric", hidden: false },
              { name: "Aggregation", key: "aggregation", hidden: false },
              { name: "Threshold", key: "threshold", hidden: false },
              { name: "Grouping", key: "grouping", hidden: false },
              { name: "Time Window", key: "time_window", hidden: false },
              {
                name: "Min Requests",
                key: "minimum_request_count",
                hidden: false,
              },
              { name: "Filter", key: "filter", hidden: false },
              { name: "Emails", key: "emails", hidden: false },
              {
                name: "Slack Channels",
                key: "slack_channels",
                hidden: false,
              },
            ]}
            rows={alerts?.map((key) => {
              return {
                ...key,
                actions: (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md bg-muted p-1.5 text-xs text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                      onClick={() => {
                        setEditAlertOpen(true);
                        const alertToEdit = alerts.find(
                          (alert) => alert.id === key.id,
                        );
                        setSelectedAlert(alertToEdit);
                      }}
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md bg-destructive/10 p-1.5 text-xs text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                      onClick={() => {
                        setDeleteAlertOpen(true);
                        setSelectedAlert(key);
                      }}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                ),
                key_name: <p className="text-xs font-semibold">{key.name}</p>,
                status: (
                  <div>
                    {key.status === "resolved" ? (
                      <Tooltip title={"Healthy"}>
                        <Badge
                          variant="outline"
                          className="border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                        >
                          Healthy
                        </Badge>
                      </Tooltip>
                    ) : (
                      <Tooltip title={"Triggered"}>
                        <Badge variant="destructive">Triggered</Badge>
                      </Tooltip>
                    )}
                  </div>
                ),
                created_at: (
                  <p className="text-xs text-muted-foreground">
                    {getUSDate(new Date(key.created_at || ""))}
                  </p>
                ),
                metric: (
                  <Badge variant="helicone">
                    {formatMetric(key.metric)}
                  </Badge>
                ),
                aggregation: (
                  <p className="text-xs">
                    {formatAggregation(
                      key.metric,
                      (key as any).aggregation as string | null,
                    )}
                  </p>
                ),
                threshold: (
                  <p className="text-xs">
                    {formatThreshold(key.metric, key.threshold)}
                  </p>
                ),
                grouping: (
                  <p className="text-xs">
                    {(key as any).grouping
                      ? (key as any).grouping
                      : "—"}
                  </p>
                ),
                time_window: (
                  <p className="text-xs">{formatTimeWindow(key.time_window)}</p>
                ),
                minimum_request_count: (
                  <p className="text-xs">{key.minimum_request_count || 0}</p>
                ),
                filter: (
                  <p className="text-xs">
                    {key.filter ? "Yes" : "No"}
                  </p>
                ),
                emails: <div className="flex">{key.emails.join(", ")}</div>,
                slack_channels: (
                  <div className="flex">
                    {key.slack_channels
                      .map(
                        (channel) =>
                          slackChannels?.find(
                            (slackChannel) => slackChannel.id === channel,
                          )?.name,
                      )
                      .join(", ")}
                  </div>
                ),
              };
            })}
          />
        </div>
      </div>

      {/* Alert History Section */}
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">History</h2>
        </div>
      </div>

      <div className="p-4">
        {alertHistory.length === 0 ? (
          <div className="border-2 border-dashed border-border bg-muted p-8 text-center">
            <FileText
              size={24}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className="text-xs font-medium">
              No alerts have been triggered yet
            </p>
          </div>
        ) : (
          <div className="settings-table border-t border-border">
            <ThemedTable
              columns={[
                {
                  name: "Alert Start Time",
                  key: "alertStartTime",
                  hidden: false,
                },
                {
                  name: "Alert End Time",
                  key: "alertEndTime",
                  hidden: false,
                },
                { name: "Alert Name", key: "alertName", hidden: false },
                {
                  name: "Trigger",
                  key: "triggered_value",
                  hidden: false,
                },
                { name: "Status", key: "status", hidden: false },
              ]}
              rows={alertHistory?.map((key) => {
                return {
                  ...key,
                  alertStartTime: (
                    <p className="text-xs font-semibold">
                      {getUSDate(new Date(key.alert_start_time))}
                    </p>
                  ),
                  alertEndTime: (
                    <p className="text-xs font-semibold">
                      {key.alert_end_time
                        ? getUSDate(new Date(key.alert_end_time))
                        : ""}
                    </p>
                  ),
                  alertName: <p className="text-xs">{key.alert_name}</p>,
                  triggered_value: (
                    <p className="text-xs">
                      {formatThreshold(
                        key.alert_metric,
                        Number(key.triggered_value),
                      )}
                    </p>
                  ),
                  status: (
                    <Badge
                      variant={
                        key.status === "resolved" ? "secondary" : "destructive"
                      }
                    >
                      {key.status}
                    </Badge>
                  ),
                };
              })}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAlertModal
        open={createNewAlertModal}
        setOpen={setCreateNewAlertModal}
        onSuccess={() => {
          refetch();
        }}
      />
      <EditAlertModal
        open={editAlertOpen}
        setOpen={setEditAlertOpen}
        onSuccess={() => {
          refetch();
        }}
        currentAlert={selectedAlert}
      />
      <DeleteAlertModal
        open={deleteAlertOpen}
        setOpen={setDeleteAlertOpen}
        onSuccess={() => {
          refetch();
        }}
        alertId={selectedAlert?.id || ""}
      />
    </SettingsContainer>
  );
};

export default AlertsPage;
