import { useState } from "react";
import { User } from "@supabase/auth-helpers-nextjs";
import { BellSlashIcon, BellIcon } from "@heroicons/react/24/solid";

// Components
import CreateNewAlertModal from "./createNewAlertModal";
import DeleteAlertModal from "./deleteAlertModal";
import { Database } from "../../../supabase/database.types";
import ThemedTable from "../../shared/themed/themedTable";

interface AlertsPageProps {
  user: User;
  orgId: string;
  // TODO: add types
  alerts: any;
  alertIsLoading: boolean;
  refreshAlert: () => void;
  alertHistory: any;
  alertHistoryIsLoading: boolean;
  refreshAlertHistory: () => void;
}

const AlertsPage = (props: AlertsPageProps) => {
  const {
    user,
    orgId,
    alerts,
    alertIsLoading,
    refreshAlert,
    alertHistory,
    alertHistoryIsLoading,
    refreshAlertHistory,
  } = props;
  const [createNewAlertModal, setCreateNewAlertModal] = useState(false);
  const [deleteAlertModal, setDeleteAlertModal] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<
    Database["public"]["Tables"]["alert_history"]["Row"] | null
  >(null);

  const handleOpenDeleteModal = (
    alertId: Database["public"]["Tables"]["alert_history"]["Row"]
  ) => {
    setSelectedAlertId(alertId);
    setDeleteAlertModal(true);
  };

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
        {/* Active Alerts */}
        <div className="items-start justify-between sm:flex ">
          <div>
            <h4 className="text-gray-800 text-xl font-semibold dark:text-gray-200">
              Active Alerts
            </h4>
            <p className="mt-2 text-gray-600 text-base sm:text-sm dark:text-gray-400">
              These are the alerts that are currently active for your
              organization
            </p>
          </div>
          <button
            onClick={() => setCreateNewAlertModal(true)}
            className="flex flex-row items-center gap-2 items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create a new alert
          </button>
        </div>
        <ul className="mt-4 divide-y overflow-auto">
          {alerts?.data?.length === 0 ? (
            // No alerts
            <button
              onClick={() => {
                setCreateNewAlertModal(true);
              }}
              className="relative block w-full rounded-lg border-2 border-dashed bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 hover:cursor-pointer border-gray-500 p-12 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <div className="w-full justify-center align-middle items-center">
                <BellIcon className="h-10 w-10 mx-auto text-gray-800 dark:text-gray-200" />
              </div>

              <span className="mt-2 block text-sm font-medium text-gray-800 dark:text-gray-200">
                Click here to create a new alert
              </span>
            </button>
          ) : (
            <ThemedTable
              columns={[
                { name: "Alert Name", key: "key_name", hidden: false },
                { name: "Metric", key: "metric", hidden: false },
                { name: "Threshold", key: "threshold", hidden: false },
                { name: "Time Window", key: "time_window", hidden: false },
                { name: "Emails", key: "emails", hidden: false },
                { name: "Created", key: "created_at", hidden: false },
              ]}
              rows={alerts?.data?.map(
                (key: Database["public"]["Tables"]["alert"]["Row"]) => {
                  return {
                    ...key,
                    key_name: (
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {key.name}
                      </p>
                    ),
                    metric: (
                      <p className="text-gray-900 dark:text-gray-100">
                        {key.metric}
                      </p>
                    ),
                    threshold: (
                      <p className="text-gray-900 dark:text-gray-100">
                        {key.threshold}%
                      </p>
                    ),
                    time_window: (
                      <p className="text-gray-900 dark:text-gray-100">
                        {key.time_window / 60000} minutes
                      </p>
                    ),
                    emails: (
                      // use bg-gray-100 dark:bg-gray-900 dont use ThemedPill
                      <p className="text-gray-900 dark:text-gray-100">
                        {key.emails.map((email: string, index: number) => {
                          return (
                            <span
                              key={index}
                              className="bg-gray-100 dark:bg-gray-900 rounded-md px-2 py-1 text-sm mr-1"
                            >
                              {email}
                            </span>
                          );
                        })}
                      </p>
                    ),
                    created_at: (
                      <p className="text-gray-500">
                        {new Date(key.created_at as string).toLocaleString()}
                      </p>
                    ),
                  };
                }
              )}
              deleteHandler={handleOpenDeleteModal}
              // editHandler={onEditHandler}
            />
          )}
        </ul>
      </div>
      <div>
        {/* Alert History */}
        <div className="items-start justify-between sm:flex ">
          <div>
            <h4 className="text-gray-800 text-xl font-semibold dark:text-gray-200">
              Alert History
            </h4>
            <p className="mt-2 text-gray-600 text-base sm:text-sm dark:text-gray-400">
              These are the alerts that have been triggered for your
              organization
            </p>
          </div>
        </div>
        <ul className="mt-12 divide-y">
          {alertHistory?.data?.length === 0 ? (
            // No alerts
            <div className="flex justify-center items-center flex-col mt-10">
              <BellSlashIcon className="w-12 h-12 text-gray-400" />
              <p className="text-sm text-gray-800 dark:text-gray-100">
                No alert history
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can sleep easy knowing that no alerts have been triggered
              </p>
            </div>
          ) : (
            <ThemedTable
              columns={[
                {
                  name: "Alert Name",
                  key: "alertName",
                  hidden: false,
                },
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
                {
                  name: "Triggered Value",
                  key: "triggeredValue",
                  hidden: false,
                },
                {
                  name: "Status",
                  key: "status",
                  hidden: false,
                },
              ]}
              rows={alertHistory?.data?.map(
                (key: Database["public"]["Tables"]["alert_history"]["Row"]) => {
                  return {
                    ...key,
                    alertName: (
                      <p className="text-gray-900 dark:text-gray-100">
                        {/* Name will come later */}
                        {key.alert_metric}
                      </p>
                    ),
                    alertStartTime: (
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {new Date(key.alert_start_time).toLocaleDateString()}
                      </p>
                    ),
                    alertEndTime: (
                      <p className="text-gray-900 dark:text-gray-100">
                        {new Date(
                          key.alert_end_time as string
                        ).toLocaleDateString()}
                      </p>
                    ),
                    triggeredValue: (
                      <p className="text-gray-900 dark:text-gray-100">
                        {key.triggered_value}
                      </p>
                    ),
                    status: (
                      <p className="text-gray-500">
                        {key.status === "triggered" ? (
                          <span className="bg-red-100 dark:bg-red-900 rounded-md px-2 py-1 text-sm mr-1">
                            {key.status}
                          </span>
                        ) : (
                          <span className="bg-green-100 dark:bg-green-900 rounded-md px-2 py-1 text-sm mr-1">
                            {key.status}
                          </span>
                        )}
                      </p>
                    ),
                  };
                }
              )}
            />
          )}
        </ul>
      </div>
      <CreateNewAlertModal
        open={createNewAlertModal}
        setOpen={setCreateNewAlertModal}
        orgId={orgId}
        onSuccess={() => {
          refreshAlert();
          refreshAlertHistory();
        }}
      />
      <DeleteAlertModal
        open={deleteAlertModal}
        setOpen={setDeleteAlertModal}
        orgId={orgId}
        alertId={selectedAlertId}
        onSuccess={() => {
          refreshAlert();
          refreshAlertHistory();
          setSelectedAlertId(null); // Reset selected alert ID
        }}
      />
    </>
  );
};

export default AlertsPage;
