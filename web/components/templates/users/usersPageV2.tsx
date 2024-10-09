import { UserGroupIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useCallback } from "react";
import { useDebounce } from "../../../services/hooks/debounce";
import { useUsers } from "../../../services/hooks/users";
import { userTableFilters } from "../../../services/lib/filters/frontendFilterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import AuthHeader from "../../shared/authHeader";
import ThemedTable from "../../shared/themed/table/themedTable";
import {
  UIFilterRowTree,
  filterUITreeToFilterNode,
  getRootFilterNode,
} from "../../../services/lib/filters/uiFilterRowTree";
import TableFooter from "../requestsV2/tableFooter";
import { INITIAL_COLUMNS } from "./initialColumns";

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

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );
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
    filterUITreeToFilterNode(
      userTableFilters.sort((a, b) => a.label.localeCompare(b.label)),
      debouncedAdvancedFilters
    )
  );

  const checkIsNotUniqueUser = useCallback(() => {
    if (users.length === 0 || users.length > 1) {
      return false;
    }
    if (users.length === 1) {
      // check the user id and see if it is an empty string
      const user = users[0];
      return user.user_id === "";
    }
  }, [users]);

  const onSetAdvancedFiltersHandler = useCallback(
    (filters: UIFilterRowTree) => {
      setAdvancedFilters(filters);
    },
    []
  );

  return (
    <>
      <AuthHeader title={"Users"} />
      <div className="flex flex-col space-y-4">
        <ThemedTable
          id="user-table"
          defaultData={users}
          defaultColumns={INITIAL_COLUMNS}
          skeletonLoading={isLoading}
          dataLoading={false}
          sortable={sort}
          advancedFilters={{
            filterMap: userTableFilters,
            setAdvancedFilters: onSetAdvancedFiltersHandler,
            filters: advancedFilters,
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
