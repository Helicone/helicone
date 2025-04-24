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
import { H3, Muted, P, Small } from "@/components/ui/typography";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AuthHeader from "@/components/shared/authHeader";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";

interface AlertsPageProps {}

const AlertsPage = (props: AlertsPageProps) => {
  const [createNewAlertModal, setCreateNewAlertModal] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [editAlertOpen, setEditAlertOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] =
    useState<Database["public"]["Tables"]["alert"]["Row"]>();
  const orgContext = useOrg();

  const { alertHistory, alerts, isLoading, refetch } = useAlertsPage(
    orgContext?.currentOrg?.id || ""
  );

  const { data: slackChannelsData, isLoading: isLoadingSlackChannels } =
    useGetOrgSlackChannels(orgContext?.currentOrg?.id || "");

  // Free tier limit checks
  const alertCount = alerts?.length || 0;
  const {
    canCreate: canCreateAlert,
    hasAccess,
    freeLimit: MAX_ALERTS,
  } = useFeatureLimit("alerts", alertCount);

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
      <div className="flex flex-col w-full h-screen bg-background dark:bg-sidebar-background">
        <div className="flex flex-1 h-full">
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
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingAnimation height={175} width={175} title="Loading alerts..." />
      </div>
    );
  }

  return (
    <div className="">
      <AuthHeader title="" />

      {!canCreateAlert && (
        <FreeTierLimitBanner
          feature="alerts"
          itemCount={alertCount}
          freeLimit={MAX_ALERTS}
          className="mb-6"
        />
      )}

      <div className="flex flex-col gap-8 px-8">
        {/* Active Alerts Section */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col gap-1">
                <H3>Active Alerts</H3>
                <Muted>
                  These are the alerts that are currently active for your
                  organization
                </Muted>
              </div>

              <div className="flex flex-col items-end gap-1">
                <FreeTierLimitWrapper feature="alerts" itemCount={alertCount}>
                  <Button variant="action" onClick={handleCreateAlert}>
                    Create a new alert
                  </Button>
                </FreeTierLimitWrapper>
              </div>
            </div>
          </div>

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
                key_name: <P className="font-semibold">{key.name}</P>,
                status: (
                  <div>
                    {key.status === "resolved" ? (
                      <Tooltip title={"Healthy"}>
                        <Badge
                          variant="default"
                          className="bg-green-500 hover:bg-green-600"
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
                  <Small className="text-muted-foreground">
                    {getUSDate(new Date(key.created_at || ""))}
                  </Small>
                ),
                threshold: (
                  <P>
                    {key.metric === "response.status" && (
                      <span>{`${key.threshold}%`}</span>
                    )}
                    {key.metric === "cost" && (
                      <span>{`$${key.threshold.toFixed(2)}`}</span>
                    )}
                  </P>
                ),
                metric: (
                  <Badge variant="helicone">
                    {key.metric === "response.status" ? "status" : key.metric}
                  </Badge>
                ),
                time_window: <P>{formatTimeWindow(key.time_window)}</P>,
                minimum_request_count: <P>{key.minimum_request_count}</P>,
                emails: <div className="flex">{key.emails.join(", ")}</div>,
                slack_channels: (
                  <div className="flex">
                    {key.slack_channels
                      .map(
                        (channel) =>
                          slackChannelsData?.find(
                            (slackChannel) => slackChannel.id === channel
                          )?.name
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
        </section>

        {/* Alert History Section */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <H3>Alert History</H3>
            <Muted>
              These are the alerts that have been triggered for your
              organization
            </Muted>
          </div>

          {alertHistory.length === 0 ? (
            <Card className="border-2 border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText size={24} className="text-foreground mb-2" />
                <P className="font-medium">No alerts have been triggered yet</P>
              </CardContent>
            </Card>
          ) : (
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
                    <P className="font-semibold">
                      {getUSDate(new Date(key.alert_start_time))}
                    </P>
                  ),
                  alertEndTime: (
                    <P className="font-semibold">
                      {key.alert_end_time
                        ? getUSDate(new Date(key.alert_end_time))
                        : ""}
                    </P>
                  ),
                  alertName: <P>{key.alert_name}</P>,
                  triggered_value: (
                    <P>
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
                    </P>
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
          )}
        </section>

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
      </div>
    </div>
  );
};

export default AlertsPage;
