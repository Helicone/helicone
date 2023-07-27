import { Dialog } from "@headlessui/react";
import {
  ClipboardDocumentIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { UserMetric } from "../../../lib/api/users/users";
import { useDebounce } from "../../../services/hooks/debounce";
import { useUsers } from "../../../services/hooks/users";
import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import { userTableFilters } from "../../../services/lib/filters/frontendFilterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import {
  SortDirection,
  SortLeafUsers,
} from "../../../services/lib/sorts/users/sorts";
import AuthHeader from "../../shared/authHeader";
import useNotification from "../../shared/notification/useNotification";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedModal from "../../shared/themed/themedModal";
import TableFooter from "../requestsV2/tableFooter";
import { INITIAL_COLUMNS } from "./initialColumns";
import { RenderBarChart } from "../../shared/metrics/barChart";

function formatNumber(num: number) {
  const numParts = num.toString().split(".");

  if (numParts.length > 1) {
    const decimalPlaces = numParts[1].length;
    if (decimalPlaces < 2) {
      return num.toFixed(2);
    } else if (decimalPlaces > 6) {
      return num.toFixed(6);
    } else {
      return num;
    }
  } else {
    return num.toFixed(2);
  }
}
interface UsersPageV2Props {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}

const UsersPageV2 = (props: UsersPageV2Props) => {
  const { currentPage, pageSize, sort } = props;

  const [page, setPage] = useState<number>(currentPage);
  const [open, setOpen] = useState(false);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 2_000); // 2 seconds
  const [selectedUser, setSelectedUser] = useState<UserMetric>();

  const sortLeaf: SortLeafRequest =
    sort.sortKey && sort.sortDirection
      ? {
          [sort.sortKey]: sort.sortDirection,
        }
      : {
          last_active: "desc",
        };

  const { users, count, from, isLoading, to, refetch, dailyActiveUsers } =
    useUsers(
      currentPage,
      currentPageSize,
      sortLeaf,
      filterListToTree(
        filterUIToFilterLeafs(userTableFilters, debouncedAdvancedFilters),
        "and"
      )
    );
  const { setNotification } = useNotification();

  const onPageSizeChangeHandler = async (newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    refetch();
  };

  const onPageChangeHandler = async (newPageNumber: number) => {
    setPage(newPageNumber);
    refetch();
  };

  return (
    <>
      <AuthHeader title={"Users"} />
      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-5 gap-4 h-96">
          <div className="col-span-5 md:col-span-5 bg-white border border-gray-300 rounded-lg">
            <div className="flex flex-col space-y-4 py-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                Daily Active users
              </h3>
              <div className="h-72 px-4">
                {isLoading ? (
                  <div className="h-full w-full flex-col flex p-8">
                    <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
                  </div>
                ) : (
                  <RenderBarChart
                    data={
                      dailyActiveUsers?.data?.map((r) => ({
                        time: new Date(r.time_step),
                        value: r.user_count_step,
                      })) ?? []
                    }
                    timeMap={(date) => date.toLocaleString()}
                    valueLabel="user count"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <ThemedTableV5
          defaultData={users}
          defaultColumns={INITIAL_COLUMNS}
          tableKey="userColumnVisibility"
          dataLoading={isLoading}
          sortable={sort}
          advancedFilters={{
            filterMap: userTableFilters,
            filters: advancedFilters,
            setAdvancedFilters,
            searchPropertyFilters: async () => ({
              data: null,
              error: "Not implemented",
            }),
          }}
          exportData={users}
          onRowSelect={(row) => {
            setSelectedUser(row);
            setOpen(true);
          }}
        />
        <TableFooter
          currentPage={currentPage}
          pageSize={pageSize}
          isCountLoading={isLoading}
          count={count || 0}
          onPageChange={onPageChangeHandler}
          onPageSizeChange={onPageSizeChangeHandler}
          pageSizeOptions={[25, 50, 100]}
        />
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-full min-w-[300px] flex flex-col">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
            <UserCircleIcon
              className="h-8 w-8 text-sky-600"
              aria-hidden="true"
            />
          </div>

          <div className="mt-3 text-center sm:mt-5">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900"
            >
              User Information
            </Dialog.Title>
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex w-full justify-center text-base font-medium text-gray-500 sm:text-sm items-center"
              onClick={() => {
                setNotification("Copied to clipboard", "success");
                navigator.clipboard.writeText(JSON.stringify(selectedUser));
              }}
            >
              Copy to clipboard
              <ClipboardDocumentIcon className="h-5 w-5 ml-1" />
            </button>
            <ul className="mt-4 space-y-2">
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>User Id:</p>
                <p>{selectedUser?.user_id}</p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Active For:</p>
                <p className="max-w-xl whitespace-pre-wrap text-left">
                  {selectedUser?.active_for} days
                </p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Last Active:</p>
                <p className="max-w-xl whitespace-pre-wrap text-left">
                  {new Date(selectedUser?.last_active || "").toLocaleString()}
                </p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Total Requests:</p>
                <p>{selectedUser?.total_requests}</p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Average Requests per day:</p>
                <p>{selectedUser?.average_requests_per_day_active}</p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Tokens per request:</p>
                <p> {selectedUser?.average_tokens_per_request}</p>
              </li>
              <li className="w-full flex flex-row justify-between gap-4 text-sm">
                <p>Total Cost:</p>
                <p className="">{`$${formatNumber(
                  selectedUser?.cost || 0
                )}`}</p>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 w-full justify-between gap-4 flex flex-row">
          <button
            type="button"
            tabIndex={-1}
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:text-sm"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      </ThemedModal>
    </>
  );
};

export default UsersPageV2;
