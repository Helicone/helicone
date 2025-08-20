import { useState } from "react";
import { useOrg } from "../../layout/org/organizationContext";
import useAlertsPage from "./useAlertsPage";
import { CreateAlertModal, EditAlertModal } from "./createAlertModal";
import DeleteAlertModal from "./deleteAlertModal";
import ThemedTable from "../../shared/themed/themedTable";
import { getUSDate } from "../../shared/utils/utils";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { useGetOrgSlackChannels } from "@/services/hooks/organizations";
import { alertTimeWindows } from "./constant";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import "@/styles/settings-tables.css";
import { SettingsContainer } from "@/components/ui/settings-container";
import "@/styles/settings.css";
import { Database } from "@/db/database.types";

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
    <SettingsContainer>
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
            <h1 className="text-sm font-semibold">Active Alerts</h1>
            <p className="text-xs text-muted-foreground">
              These are the alerts that are currently active for your
              organization
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <FreeTierLimitWrapper feature="alerts" itemCount={alertCount}>
              <Button
                variant="default"
                size="sm"
                className="text-xs"
                onClick={handleCreateAlert}
              >
                Create a new alert
              </Button>
            </FreeTierLimitWrapper>
          </div>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="settings-table border-t border-border">
          <ThemedTable
            columns={[
              { name: "Name", key: "key_name", hidden: false },
              { name: "Status", key: "status", hidden: false },
              { name: "Created", key: "created_at", hidden: false },
              { name: "Threshold", key: "threshold", hidden: false },
              { name: "Metric", key: "metric", hidden: false },
              { name: "Time Window", key: "time_window", hidden: false },
              {
                name: "Min Requests",
                key: "minimum_request_count",
                hidden: false,
              },
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
                key_name: (
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">{key.name}</p>
                    {key.filter && (
                      <Tooltip title="Has filter conditions">
                        <Filter className="h-3 w-3 text-muted-foreground" />
                      </Tooltip>
                    )}
                  </div>
                ),
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
                threshold: (
                  <p className="text-xs">
                    {key.metric === "response.status" && (
                      <span>{`${key.threshold}%`}</span>
                    )}
                    {key.metric === "cost" && (
                      <span>{`$${Number(key.threshold).toFixed(2)}`}</span>
                    )}
                  </p>
                ),
                metric: (
                  <Badge variant="helicone">
                    {key.metric === "response.status" ? "status" : key.metric}
                  </Badge>
                ),
                time_window: (
                  <p className="text-xs">{formatTimeWindow(key.time_window)}</p>
                ),
                minimum_request_count: (
                  <p className="text-xs">{key.minimum_request_count}</p>
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
            editHandler={(row) => {
              setEditAlertOpen(true);
              const alertToEdit = alerts.find((alert) => alert.id === row.id);
              setSelectedAlert(alertToEdit);
            }}
            deleteHandler={(row) => {
              setDeleteAlertOpen(true);
              setSelectedAlert(row);
            }}
          />
        </div>
      </div>

      {/* Alert History Section */}
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">Alert History</h2>
          <p className="text-xs text-muted-foreground">
            These are the alerts that have been triggered for your organization
          </p>
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
                      {key.alert_metric === "response.status" && (
                        <span>{`${key.triggered_value}%`}</span>
                      )}
                      {key.alert_metric === "cost" && (
                        <span>{`$${key.triggered_value}`}</span>
                      )}
                      {key.alert_metric !== "response.status" &&
                        key.alert_metric !== "cost" && (
                          <span>{key.triggered_value}</span>
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
