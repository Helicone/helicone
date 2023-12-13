import { useState } from "react";

// Components
import CreateNewAlertModal from "./createNewAlertModal";

import { SUPABASE_AUTH_TOKEN } from "../../../lib/constants";
import Cookies from "js-cookie";
import { set } from "date-fns";
import { useOrg } from "../../shared/layout/organizationContext";
import useAlertsPage from "./useAlertsPage";
import CreateAlertModal from "./createAlertModal";
import { BellIcon, NewspaperIcon } from "@heroicons/react/24/outline";
import DeleteAlertModal from "./deleteAlertModal";
import ThemedTable from "../../shared/themed/themedTable";
import { User } from "@supabase/auth-helpers-react";
import useNotification from "../../shared/notification/useNotification";
import { Database } from "../../../supabase/database.types";

interface AlertsPageProps {
  user: User;
}

const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || "";

const AlertsPage = (props: AlertsPageProps) => {
  const { user } = props;
  const { setNotification } = useNotification();
  const [createNewAlertModal, setCreateNewAlertModal] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] =
    useState<Database["public"]["Tables"]["alert"]["Row"]>();
  const orgContext = useOrg();
  const { alertHistory, alerts, isLoading, refetch } = useAlertsPage(
    orgContext?.currentOrg.id || ""
  );

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
                { name: "Created", key: "created_at", hidden: false },
                { name: "Threshold", key: "threshold", hidden: false },
                { name: "Metric", key: "metric", hidden: false },
                { name: "Time Window", key: "time_window", hidden: false },
                { name: "Emails", key: "emails", hidden: false },
              ]}
              rows={alerts?.map((key: any) => {
                return {
                  ...key,
                  key_name: (
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {key.name}
                    </p>
                  ),
                  created_at: (
                    <p className="text-gray-500">
                      {new Date(key.created_at || "").toLocaleString()}
                    </p>
                  ),
                  threshold: (
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {`${key.threshold}%`}
                    </p>
                  ),
                  metric: (
                    <p className="text-gray-900 dark:text-gray-100">
                      {key.metric}
                    </p>
                  ),
                  time_window: (
                    <p className="text-gray-900 dark:text-gray-100">
                      {/* convert to minutes */}
                      {`${key.time_window / 60000} minutes`}
                    </p>
                  ),
                  emails: (
                    <p className="text-gray-900 dark:text-gray-100">
                      {key.emails.join(", ")}
                    </p>
                  ),
                };
              })}
              deleteHandler={(row) => {
                setDeleteAlertOpen(true);
                setSelectedAlert(row);
              }}
              // editHandler={onEditHandler}
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
          <div className="relative block w-full rounded-lg border-2 border-dashed hover:cursor-pointer border-gray-500 p-12 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
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
              { name: "Alert Name", key: "alertName", hidden: false },
              { name: "status", key: "status", hidden: false },
            ]}
            rows={alertHistory?.map((key: any) => {
              return {
                ...key,
                alertStartTime: (
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {key.alert_start_time}
                  </p>
                ),
                alertName: (
                  <p className="text-gray-900 dark:text-gray-100">
                    {/* Name will come later */}
                    {key.alert_metric}
                  </p>
                ),
                status: (
                  <p className="text-gray-500">
                    {new Date(key.alert_start_time).toLocaleString()}
                  </p>
                ),
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
