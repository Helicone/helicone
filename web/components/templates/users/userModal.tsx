import { Tooltip } from "@mui/material";
import { UserMetric } from "../../../lib/api/users/users";
import { clsx } from "../../shared/clsx";
import ThemedModal from "../../shared/themed/themedModal";
import { getUSDate, getUSDateFromString } from "../../shared/utils/utils";
import { formatNumber } from "./initialColumns";
import {
  ClipboardDocumentIcon,
  TableCellsIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import useNotification from "../../shared/notification/useNotification";
import StyledAreaChart from "../dashboard/styledAreaChart";
import { AreaChart } from "@tremor/react";
import { useEffect, useState } from "react";
import { useUserRequests } from "./useUserRequests";
import {
  DASHBOARD_PAGE_TABLE_FILTERS,
  REQUEST_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { useRouter } from "next/router";
import { encodeFilter } from "../requestsV2/requestsPageV2";
import useSearchParams from "../../shared/utils/useSearchParams";

interface UserModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user?: UserMetric;
}

const UserModal = (props: UserModalProps) => {
  const { open, setOpen, user } = props;

  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [userCost, setUserCost] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCostLoading, setIsCostLoading] = useState(false);

  const { setNotification } = useNotification();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    setIsCostLoading(true);
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
    fetch("/api/metrics/costOverTime", {
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
          cost: +d.cost,
          date: getTimeMap("day")(new Date(d.time)),
        }));
        setUserCost(cleaned);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsCostLoading(false);
      });
  }, [open, user?.user_id]);

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      {user ? (
        <div className="flex flex-col space-y-4 w-full min-w-[400px] h-full">
          <div className="w-full flex flex-row justify-between items-center">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-xl truncate w-[300px]">
              {user.user_id}
            </h2>
            <div className="flex flex-row items-center gap-3">
              <Tooltip title="View Requests">
                <button
                  onClick={() => {
                    const currentAdvancedFilters = encodeURIComponent(
                      JSON.stringify(
                        [
                          {
                            filterMapIdx: 3,
                            operatorIdx: 0,
                            value: user.user_id,
                          },
                        ]
                          .map(encodeFilter)
                          .join("|")
                      )
                    );

                    router.push({
                      pathname: "/requests",
                      query: {
                        t: "3m",
                        filters: JSON.stringify(currentAdvancedFilters),
                      },
                    });
                  }}
                  tabIndex={-1}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md -m-1 p-1"
                >
                  <TableCellsIcon className="h-5 w-5 text-gray-500" />
                </button>
              </Tooltip>
              <Tooltip title="Copy">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(user));
                    setNotification("Copied to clipboard", "success");
                  }}
                  tabIndex={-1}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md -m-1 p-1"
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
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md -m-1 p-1"
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
          <div>
            <StyledAreaChart
              title={"Cost of requests in the last 30 days"}
              value={undefined}
              isDataOverTimeLoading={isCostLoading}
              height={"128px"}
            >
              <AreaChart
                data={userCost}
                categories={["cost"]}
                index={"date"}
                className="h-32 -ml-4 pt-4"
                colors={["orange"]}
                showLegend={false}
              />
            </StyledAreaChart>
          </div>

          <ul
            className={clsx(
              "grid grid-cols-1 gap-x-4 divide-y divide-gray-300 dark:divide-gray-700 justify-between text-sm w-full"
            )}
          >
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Total Cost
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">{`$${formatNumber(
                user.cost
              )}`}</p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Active For
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">{`${user.active_for} days`}</p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Last Active
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">
                {getUSDateFromString(user.last_active.toString())}
              </p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Total Requests
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">
                {user.total_requests}
              </p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Average Requests per Day
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">
                {formatNumber(user.average_requests_per_day_active)}
              </p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Average Tokens per Request
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">
                {formatNumber(user.average_tokens_per_request)}
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
