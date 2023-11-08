import { Tooltip } from "@mui/material";
import { UserMetric } from "../../../lib/api/users/users";
import { clsx } from "../../shared/clsx";
import ThemedModal from "../../shared/themed/themedModal";
import { getUSDate, getUSDateFromString } from "../../shared/utils/utils";
import { formatNumber } from "./initialColumns";
import { ClipboardDocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import useNotification from "../../shared/notification/useNotification";
import StyledAreaChart from "../dashboard/styledAreaChart";
import { AreaChart } from "@tremor/react";
import { useEffect, useState } from "react";
import { useUserRequests } from "./useUserRequests";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import { getTimeMap } from "../../../lib/timeCalculations/constants";

interface UserModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user?: UserMetric;
}

const UserModal = (props: UserModalProps) => {
  const { open, setOpen, user } = props;

  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { setNotification } = useNotification();

  useEffect(() => {
    setIsLoading(true);
    const filterMap = DASHBOARD_PAGE_TABLE_FILTERS as SingleFilterDef<any>[];

    const userFilters = filterUIToFilterLeafs(filterMap, []).concat([
      {
        response_copy_v3: {
          user_id: {
            equals: user?.user_id,
          },
        },
      },
    ]);

    const timeFilter = {
      start: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    fetch("/api/metrics/requestOverTime", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeFilter: {
          start: timeFilter.start.toISOString(),
          end: timeFilter.end.toISOString(),
        },
        filter: filterListToTree(userFilters, "and"),
        apiKeyFilter: null,
        dbIncrement: "day",
        timeZoneDifference: new Date().getTimezoneOffset(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const cleaned = data.data.map((d: any) => ({
          requests: +d.count,
          date: getTimeMap("day")(new Date(d.time)),
        }));
        setUserRequests(cleaned);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [open, user?.user_id]);

  console.log("requests", userRequests);

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      {user ? (
        <div className="flex flex-col space-y-4 w-full min-w-[400px] h-full">
          <div className="w-full flex flex-row justify-between items-center">
            <h2 className="font-semibold text-gray-900 text-xl truncate w-[325px]">
              {user.user_id}
            </h2>
            <div className="flex flex-row items-center space-x-2">
              <Tooltip title="Copy">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(user));
                    setNotification("Copied to clipboard", "success");
                  }}
                  tabIndex={-1}
                  className="hover:bg-gray-200 rounded-md -m-1 p-1"
                >
                  <ClipboardDocumentIcon className="h-5 w-5 text-gray-500" />
                </button>
              </Tooltip>
              <Tooltip title="Close">
                <button
                  onClick={() => {
                    setOpen(false);
                  }}
                  tabIndex={-1}
                  className="hover:bg-gray-200 rounded-md -m-1 p-1"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </Tooltip>
            </div>
          </div>
          <div>
            <StyledAreaChart
              title={"Requests last 30 days"}
              value={undefined}
              isDataOverTimeLoading={isLoading}
              height={"128px"}
            >
              <AreaChart
                data={userRequests}
                categories={["requests"]}
                index={"date"}
                className="h-32 -ml-4 pt-4"
                colors={["orange"]}
                showLegend={false}
              />
            </StyledAreaChart>
          </div>

          <ul
            className={clsx(
              "grid grid-cols-1 gap-x-4 divide-y divide-gray-300 justify-between text-sm w-full"
            )}
          >
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900">Total Cost</p>
              <p className="text-gray-700 truncate">{`$${formatNumber(
                user.cost
              )}`}</p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900">Active For</p>
              <p className="text-gray-700 truncate">{`${user.active_for} days`}</p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900">Last Active</p>
              <p className="text-gray-700 truncate">
                {getUSDateFromString(user.last_active.toString())}
              </p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900">Total Requests</p>
              <p className="text-gray-700 truncate">{user.total_requests}</p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900">
                Average Requests per Day
              </p>
              <p className="text-gray-700 truncate">
                {user.average_requests_per_day_active}
              </p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900">
                Average Tokens per Request
              </p>
              <p className="text-gray-700 truncate">
                {user.average_tokens_per_request}
              </p>
            </li>
          </ul>
        </div>
      ) : (
        <div />
      )}
    </ThemedModal>
  );
};

export default UserModal;
