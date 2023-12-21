import { useState } from "react";

import { useOrg } from "../../shared/layout/organizationContext";
import useAlertsPage from "./useAlertsPage";
import CreateAlertModal from "./createAlertModal";
import { BellIcon, NewspaperIcon } from "@heroicons/react/24/outline";
import DeleteAlertModal from "./deleteAlertModal";
import ThemedTable from "../../shared/themed/themedTable";
import { User } from "@supabase/auth-helpers-react";
import { Database } from "../../../supabase/database.types";
import { getUSDate } from "../../shared/utils/utils";
import { Tooltip } from "@mui/material";

interface AlertsPageProps {
  user: User;
}

export const alertTimeWindows: { [key: string]: number } = {
  "5 minutes": 5 * 60 * 1000,
  "10 minutes": 10 * 60 * 1000,
  "15 minutes": 15 * 60 * 1000,
  "30 minutes": 30 * 60 * 1000,
  "1 hour": 60 * 60 * 1000,
  "1 day": 24 * 60 * 60 * 1000,
  "1 week": 7 * 24 * 60 * 60 * 1000,
  "1 month": 30 * 24 * 60 * 60 * 1000,
};

const AlertsPage = (props: AlertsPageProps) => {
  const [createNewAlertModal, setCreateNewAlertModal] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] =
    useState<Database["public"]["Tables"]["alert"]["Row"]>();
  const orgContext = useOrg();

  const { alertHistory, alerts, isLoading, refetch } = useAlertsPage(
    orgContext?.currentOrg.id || ""
  );

  function formatTimeWindow(milliseconds: number): string {
    // Define the time windows with an index signature

    let closest = Object.keys(alertTimeWindows).reduce((a, b) => {
      return Math.abs(alertTimeWindows[a] - milliseconds) <
        Math.abs(alertTimeWindows[b] - milliseconds)
        ? a
        : b;
    });

    return closest;
  }

  return (
    <div className="flex flex-col space-y-16">
      <div className="flex flex-col space-y-8">
        {/* Active Alerts */}
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex flex-col space-y-1">
            <h4 className="text-gray-800 text-xl font-semibold dark:text-gray-200">
              Active Alerts
            </h4>
            <p className="text-gray-600 text-base sm:text-sm dark:text-gray-400">
              These are the alerts that are currently active for your
              organization
            </p>
          </div>
          <button
            onClick={() => setCreateNewAlertModal(true)}
            className="bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white dark:text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Create a new alert
          </button>
        </div>
        <ul className="">
          {alerts.length === 0 ? (
            <button
              onClick={() => setCreateNewAlertModal(true)}
              className="relative block w-full rounded-lg border-2 border-dashed bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 hover:cursor-pointer border-gray-500 p-12 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <div className="w-full justify-center align-middle items-center">
                <BellIcon className="h-10 w-10 mx-auto text-gray-900 dark:text-gray-100" />
              </div>
              <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Click here to generate a new alert
              </span>
            </button>
          ) : (
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
              ]}
              rows={alerts?.map((key) => {
                return {
                  ...key,
                  key_name: (
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {key.name}
                    </p>
                  ),
                  status: (
                    <div>
                      {key.status === "resolved" ? (
                        <Tooltip title={"Healthy"}>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                        </Tooltip>
                      ) : (
                        <Tooltip title={"Triggered"}>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  ),
                  created_at: (
                    <p className="text-gray-500">
                      {getUSDate(new Date(key.created_at || ""))}
                    </p>
                  ),
                  threshold: (
                    <p className="text-gray-900 dark:text-gray-100">
                      {key.metric === "response.status" && (
                        <span>{`${key.threshold}%`}</span>
                      )}
                      {key.metric === "cost" && (
                        <span>{`$${key.threshold.toFixed(2)}`}</span>
                      )}
                    </p>
                  ),
                  metric: (
                    <p className="text-xs text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-2 py-1 w-fit">
                      {key.metric === "response.status" ? "status" : key.metric}
                    </p>
                  ),
                  time_window: (
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatTimeWindow(key.time_window)}
                    </p>
                  ),
                  minimum_request_count: (
                    <p className="text-gray-900 dark:text-gray-100">
                      {key.minimum_request_count}
                    </p>
                  ),
                  emails: (
                    <div className="text-gray-900 dark:text-gray-100 flex">
                      {key.emails.join(", ")}
                    </div>
                  ),
                };
              })}
              deleteHandler={(row) => {
                setDeleteAlertOpen(true);
                setSelectedAlert(row);
              }}
            />
          )}
        </ul>
      </div>
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex flex-col space-y-1">
            <h4 className="text-gray-800 text-xl font-semibold dark:text-gray-200">
              Alert History
            </h4>
            <p className="text-gray-600 text-base sm:text-sm dark:text-gray-400">
              These are the alerts that have been triggered for your
              organization
            </p>
          </div>
        </div>
        {alertHistory.length === 0 ? (
          <div className="relative block w-full rounded-lg border-2 border-dashed border-gray-500 p-12 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <div className="w-full justify-center align-middle items-center">
              <NewspaperIcon className="h-10 w-10 mx-auto text-gray-900 dark:text-gray-100" />
            </div>
            <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
              No alerts have been triggered yet
            </span>
          </div>
        ) : (
          // List alert history
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
              { name: "status", key: "status", hidden: false },
            ]}
            rows={alertHistory?.map((key) => {
              return {
                ...key,
                alertStartTime: (
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {getUSDate(new Date(key.alert_start_time))}
                  </p>
                ),
                alertEndTime: (
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {key.alert_end_time
                      ? getUSDate(new Date(key.alert_end_time))
                      : ""}
                  </p>
                ),
                alertName: (
                  <p className="text-gray-900 dark:text-gray-100">
                    {key.alert_name}
                  </p>
                ),
                triggered_value: (
                  <p className="text-gray-900 dark:text-gray-100">
                    {`${key.triggered_value}%`}
                  </p>
                ),
                status: <p className="text-gray-500">{key.status}</p>,
              };
            })}
          />
        )}
      </div>
      <CreateAlertModal
        open={createNewAlertModal}
        setOpen={setCreateNewAlertModal}
        onSuccess={() => {
          refetch();
        }}
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
  );
};

export default AlertsPage;
