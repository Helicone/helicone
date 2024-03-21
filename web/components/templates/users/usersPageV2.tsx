import { useState } from "react";
import { useDebounce } from "../../../services/hooks/debounce";
import { useUsers } from "../../../services/hooks/users";
import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import { userTableFilters } from "../../../services/lib/filters/frontendFilterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import AuthHeader from "../../shared/authHeader";
import useNotification from "../../shared/notification/useNotification";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import TableFooter from "../requestsV2/tableFooter";
import { INITIAL_COLUMNS } from "./initialColumns";
import { useRouter } from "next/router";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

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

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 500); // 0.5 seconds

  const router = useRouter();

  const sortLeaf: SortLeafRequest =
    sort.sortKey && sort.sortDirection
      ? {
          [sort.sortKey]: sort.sortDirection,
        }
      : {
          last_active: "desc",
        };

  const { users, count, from, isLoading, to, refetch } = useUsers(
    currentPage,
    pageSize,
    sortLeaf,
    filterListToTree(
      filterUIToFilterLeafs(
        userTableFilters.sort((a, b) => a.label.localeCompare(b.label)),
        debouncedAdvancedFilters
      ),
      "and"
    )
  );
  const { setNotification } = useNotification();

  const checkIsNotUniqueUser = () => {
    if (users.length === 0 || users.length > 1) {
      return false;
    }
    if (users.length === 1) {
      // check the user id and see if it is an empty string
      const user = users[0];
      return user.user_id === "";
    }
  };

  return (
    <>
      <AuthHeader title={"Users"} />
      <div className="flex flex-col space-y-4">
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
            router.push(`/users/${encodeURIComponent(row.user_id)}`);
          }}
        />
        {!isLoading && checkIsNotUniqueUser() && (
          <div className="flex flex-col w-full h-96 justify-center items-center bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-black">
            <div className="flex flex-col w-2/5">
              <UserGroupIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
              <p className="text-xl text-black dark:text-white font-semibold mt-8">
                No unique users found.
              </p>
              <p className="text-sm text-gray-500 max-w-sm mt-2">
                Please explore our docs{" "}
                <Link
                  href="https://docs.helicone.ai/features/advanced-usage/user-metrics"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline text-blue-500"
                >
                  here
                </Link>{" "}
                to learn more about user tracking and metrics.
              </p>
            </div>
          </div>
        )}

        <TableFooter
          currentPage={currentPage}
          pageSize={pageSize}
          isCountLoading={isLoading}
          count={count || 0}
          onPageChange={() => {
            refetch();
          }}
          onPageSizeChange={() => {
            refetch();
          }}
          pageSizeOptions={[25, 50, 100]}
          showCount={true}
        />
      </div>
    </>
  );
};

export default UsersPageV2;
