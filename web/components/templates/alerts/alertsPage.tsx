import { User } from "@supabase/auth-helpers-nextjs";
import { BellSlashIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import ThemedTable from "../../shared/themed/themedTable";
import useNotification from "../../shared/notification/useNotification";

// Components
import CreateNewAlertModal from "./createNewAlertModal";

import { SUPABASE_AUTH_TOKEN } from "../../../lib/constants";
import Cookies from "js-cookie";
import { set } from "date-fns";

interface AlertsPageProps {
  user: User;
  orgId: string;
  alerts: Array<Database["public"]["Tables"]["alert"]["Row"]>;
  alertHistory: Array<Database["public"]["Tables"]["alert_history"]["Row"]>;
}

const AlertsPage = (props: AlertsPageProps) => {
  const { user, orgId, alerts, alertHistory } = props;
  const { setNotification } = useNotification();
  const [createNewAlertModal, setCreateNewAlertModal] = useState(false);

  const handleDeleteAlert = async (id: string) => {
    try {
      console.log("Deleting alert with id:", id);
      // Auth
      const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);
      if (!authFromCookie) {
        setNotification("Please login to create an alert", "error");
        return;
      }
      const decodedCookie = decodeURIComponent(authFromCookie);
      const parsedCookie = JSON.parse(decodedCookie);
      const jwtToken = parsedCookie[0];
      const response = await fetch(`http://localhost:8787/alert/${id["id"]}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "helicone-jwt": jwtToken,
          "helicone-org-id": orgId,
        },
      });

      if (!response.ok) {
        setNotification(
          "We were unable to delete your alert successfully!\n Refresh your page to try again...",
          "error"
        );
      }
      window.location.reload();
      // Handle the response
    } catch (error) {
      setNotification(
        "We were unable to delete your alert successfully! Refresh your page to try again...",
        "error"
      );
    }
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
            className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
        <ul className="mt-12 divide-y overflow-auto">
          {alerts.length === 0 ? (
            // No alerts
            <div className="flex justify-center items-center flex-col mt-10">
              <BellSlashIcon className="w-12 h-12 text-gray-400" />
              <p className="text-sm text-gray-800 dark:text-gray-100">
                No alerts
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                There are no alerts for your organization
              </p>
            </div>
          ) : (
            <ThemedTable
              columns={[
                { name: "Name", key: "key_name", hidden: false },
                { name: "Emails", key: "emails", hidden: false },
                { name: "Created", key: "created_at", hidden: false },
              ]}
              rows={alerts?.map((key) => {
                return {
                  ...key,
                  key_name: (
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {key.name}
                    </p>
                  ),
                  emails: (
                    <p className="text-gray-900 dark:text-gray-100">
                      {key.emails}
                    </p>
                  ),
                  created_at: (
                    <p className="text-gray-500">
                      {new Date(key.created_at).toLocaleString()}
                    </p>
                  ),
                };
              })}
              deleteHandler={handleDeleteAlert}
              // editHandler={onEditHandler}
            />
            // alerts.map((item, idx) => (
            //   <li
            //     key={item.id}
            //     className="py-5 flex items-start justify-between"
            //   >
            //     <div className="flex gap-3">
            //       <div>
            //         <span className="block text-sm text-gray-700 font-semibold">
            //           {item.name}
            //         </span>
            //         <span className="block text-sm text-gray-600">
            //           {item.emails}
            //         </span>
            //       </div>
            //     </div>
            //     <a
            //       href="javascript:void(0)"
            //       className="text-red-700 text-sm border rounded-lg px-3 py-2 duration-150 bg-white hover:bg-red-100"
            //     >
            //       Delete
            //     </a>
            //   </li>
            // ))
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
          {alertHistory.length === 0 ? (
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
              rows={alertHistory?.map((key) => {
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
        </ul>
      </div>
      <CreateNewAlertModal
        open={createNewAlertModal}
        setOpen={setCreateNewAlertModal}
        user={user}
        orgId={orgId}
        onSuccess={() => {
          // refresh page
          // TODO: just refresh the table
          window.location.reload();
        }}
      />
    </>
  );
};

export default AlertsPage;
