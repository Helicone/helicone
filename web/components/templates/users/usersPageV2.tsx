import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UIFilterRowTree } from "@/services/lib/filters/types";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "../../../services/hooks/debounce";
import { useUsers } from "../../../services/hooks/users";
import { userTableFilters } from "../../../services/lib/filters/frontendFilterDefs";
import {
  filterUITreeToFilterNode,
  getRootFilterNode,
} from "../../../services/lib/filters/uiFilterRowTree";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import AuthHeader from "../../shared/authHeader";
import ThemedTable from "../../shared/themed/table/themedTable";
import TableFooter from "../requests/tableFooter";
import { INITIAL_COLUMNS } from "./initialColumns";
import { UserMetrics } from "./UserMetrics";
import { useHasAccess } from "@/hooks/useHasAccess";
import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import LoadingAnimation from "@/components/shared/loadingAnimation";

interface UsersPageV2Props {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}

function useQueryParam(
  paramName: string,
  defaultValue: string
): [queryParam: string, setQueryParam: (value: string) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setQueryParam = useCallback(
    (value: string) => {
      const currentQuery = { ...router.query };
      currentQuery[paramName] = value;
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );
    },
    [router, paramName]
  );

  // Get the current value from the URL
  const queryParam = searchParams?.get(paramName) || defaultValue;

  useEffect(() => {
    // If the parameter is not in the URL, set it to the default value
    if (!searchParams?.has(paramName)) {
      setQueryParam(defaultValue);
    }
  }, [paramName, defaultValue, searchParams, setQueryParam]);

  return [queryParam, setQueryParam];
}

const UsersPageV2 = (props: UsersPageV2Props) => {
  const [currentPage, setCurrentPage] = useQueryParam("page", "1");
  const [pageSize, setPageSize] = useQueryParam("pageSize", "100");
  const [sortDirection, setSortDirection] = useQueryParam(
    "sortDirection",
    "asc"
  );
  const [sortKey, setSortKey] = useQueryParam("sortKey", "last_active");

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 500); // 0.5 seconds

  const router = useRouter();

  const sortLeaf: SortLeafRequest =
    sortKey && sortDirection
      ? {
          [sortKey]: sortDirection,
        }
      : {
          last_active: "desc",
        };

  const filterNode = useMemo(() => {
    return filterUITreeToFilterNode(
      userTableFilters.sort((a, b) => a.label.localeCompare(b.label)),
      debouncedAdvancedFilters
    );
  }, [debouncedAdvancedFilters]);

  const { users, count, from, isLoading, to, refetch } = useUsers(
    parseInt(currentPage, 10),
    parseInt(pageSize, 10),
    sortLeaf,
    filterNode
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
  const [activeTab, setActiveTab] = useQueryParam("tab", "all");

  const advancedFiltersProp = useMemo(
    () => ({
      filterMap: userTableFilters,
      setAdvancedFilters: onSetAdvancedFiltersHandler,
      filters: advancedFilters,
      searchPropertyFilters: async () => ({
        data: null,
        error: "Not implemented",
      }),
    }),
    [advancedFilters, onSetAdvancedFiltersHandler]
  );

  const hasAccess = useHasAccess("users");

  if (!hasAccess) {
    return (
      <div className="flex justify-center items-center bg-white">
        <FeatureUpgradeCard
          title="Users"
          featureName="Users"
          headerTagline="Track user cost, usage, and more"
          icon={<UserGroupIcon className="w-4 h-4 text-sky-500" />}
          highlightedFeature="users"
        />
      </div>
    );
  }

  if (isLoading) {
    const org = useOrg();

    if (org?.currentOrg?.tier === "free") {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <LoadingAnimation />
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="flex flex-col w-full min-h-screen items-center bg-slate-50">
          <EmptyStateCard feature="users" />
        </div>
      );
    }

    return (
      <>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          defaultValue="all"
          className=""
        >
          <AuthHeader
            title={"Users"}
            actions={
              <TabsList>
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="active">User Metrics</TabsTrigger>
              </TabsList>
            }
          />

          <TabsContent value="all">
            {" "}
            <div className="flex flex-col space-y-4 pb-10">
              <ThemedTable
                id="user-table"
                defaultData={users}
                defaultColumns={INITIAL_COLUMNS}
                skeletonLoading={isLoading}
                dataLoading={false}
                sortable={{
                  sortKey: sortKey,
                  sortDirection: sortDirection as SortDirection,
                  isCustomProperty: false,
                }}
                advancedFilters={advancedFiltersProp}
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
                currentPage={parseInt(currentPage, 10)}
                pageSize={parseInt(pageSize, 10)}
                isCountLoading={isLoading}
                count={count || 0}
                onPageChange={(newPage) => {
                  setCurrentPage(newPage.toString());
                }}
                onPageSizeChange={(newPageSize) => {
                  setPageSize(newPageSize.toString());
                }}
                pageSizeOptions={[100, 250, 500]}
                showCount={true}
              />
            </div>
          </TabsContent>
          <TabsContent value="active">
            {/* I will add this back in later... we need to move everything to JAWN
          <ThemedHeader
            advancedFilter={{
              filterMap: advancedFiltersProp.filterMap,
              filters: advancedFiltersProp.filters,
              onAdvancedFilter: advancedFiltersProp.setAdvancedFilters,
              searchPropertyFilters: advancedFiltersProp.searchPropertyFilters,
            }}
            isFetching={false}
          /> */}
            <UserMetrics filterNode={filterNode} />
          </TabsContent>
        </Tabs>
      </>
    );
  }
};

export default UsersPageV2;
