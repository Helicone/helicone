import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { UserMetric } from "@/lib/api/users/UserMetric";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { LockIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUsers } from "../../../services/hooks/users";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import AuthHeader from "../../shared/authHeader";
import ThemedTable from "../../shared/themed/table/themedTable";
import { UpgradeProDialog } from "../organization/plan/upgradeProDialog";
import TableFooter from "../requests/tableFooter";
import { INITIAL_COLUMNS } from "./initialColumns";
import { UserMetrics } from "./UserMetrics";
import { useFilterAST } from "@/filterAST/context/filterContext";

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

  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const router = useRouter();

  const sortLeaf: SortLeafRequest =
    sortKey && sortDirection
      ? {
          [sortKey]: sortDirection,
        }
      : {
          last_active: "desc",
        };

  const { userMetrics } = useUsers(
    parseInt(currentPage, 10),
    parseInt(pageSize, 10),
    sortLeaf
  );

  const { hasAccess, freeLimit, upgradeMessage, canCreate } = useFeatureLimit(
    "users",
    userMetrics.data?.data?.data?.count ?? 0
  );

  const [activeTab, setActiveTab] = useQueryParam("tab", "all");
  const filter = useFilterAST();

  const columns = useMemo(() => {
    if (hasAccess) {
      return INITIAL_COLUMNS;
    }

    return INITIAL_COLUMNS.map((column) => {
      if ("accessorKey" in column && column.accessorKey === "user_id") {
        return {
          ...column,
          cell: (info: any) => {
            const user = info.row.original;
            const userIndex =
              userMetrics.data?.data?.data?.users?.findIndex(
                (u) => u.user_id === user.user_id
              ) ?? 0;
            const isPremium = userIndex >= freeLimit;

            return (
              <span
                className={`text-gray-900 dark:text-gray-100 font-medium ${
                  isPremium ? "opacity-70" : ""
                }`}
              >
                {isPremium && (
                  <LockIcon className="h-3 w-3 inline mr-1 text-muted-foreground" />
                )}
                {user.user_id ? `${user.user_id}` : "No User ID"}
              </span>
            );
          },
        };
      } else if ("accessorKey" in column) {
        const originalCell = column.cell;
        return {
          ...column,
          cell: (info: any) => {
            const user = info.row.original;
            const userIndex =
              userMetrics.data?.data?.data?.users?.findIndex(
                (u) => u.user_id === user.user_id
              ) ?? 0;
            const isPremium = userIndex >= freeLimit;

            if (isPremium) {
              return (
                <span className="blur-sm select-none opacity-70">••••••••</span>
              );
            }

            if (originalCell && typeof originalCell === "function") {
              return originalCell(info);
            }

            const value = info.getValue();
            return value !== undefined && value !== null ? String(value) : "";
          },
        };
      }
      return column;
    });
  }, [hasAccess, freeLimit, userMetrics]);

  const handleRowSelect = (row: UserMetric) => {
    // Fast exit if user has full access - direct navigation
    if (hasAccess) {
      router.push(`/users/${encodeURIComponent(row.user_id)}`);
      return;
    }

    const userIndex =
      userMetrics.data?.data?.data?.users?.findIndex(
        (u) => u.user_id === row.user_id
      ) ?? 0;
    const isPremiumUser = userIndex >= freeLimit;

    if (isPremiumUser) {
      setUpgradeDialogOpen(true);
      return;
    }

    router.push(`/users/${encodeURIComponent(row.user_id)}`);
  };

  const hasNoUsers = useMemo(() => {
    return (
      userMetrics.data?.data?.data?.users?.length === 0 ||
      (userMetrics.data?.data?.data?.users?.length === 1 &&
        userMetrics.data?.data?.data?.users?.[0]?.user_id === "")
    );
  }, [userMetrics]);

  if (
    userMetrics.data?.data?.data?.users?.length === 0 &&
    !filter.store.filter
  ) {
    return (
      <div className="flex flex-col w-full h-screen bg-background dark:bg-sidebar-background">
        <div className="flex flex-1 h-full">
          <EmptyStateCard feature="users" />
        </div>
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
          <div className="flex flex-col space-y-4 pb-10">
            {!canCreate && (
              <FreeTierLimitBanner
                feature="users"
                itemCount={userMetrics.data?.data?.data?.count ?? 0}
                freeLimit={freeLimit}
                className="w-full"
              />
            )}

            <ThemedTable
              id="user-table"
              defaultData={userMetrics.data?.data?.data?.users ?? []}
              defaultColumns={columns}
              skeletonLoading={userMetrics.isLoading}
              dataLoading={false}
              sortable={{
                sortKey: sortKey,
                sortDirection: sortDirection as SortDirection,
                isCustomProperty: false,
              }}
              exportData={userMetrics.data?.data?.data?.users ?? []}
              onRowSelect={handleRowSelect}
              showFilters
            />

            {!userMetrics.isLoading && hasNoUsers && (
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
              isCountLoading={userMetrics.isLoading}
              count={userMetrics.data?.data?.data?.count ?? 0}
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
          <UserMetrics />
        </TabsContent>
      </Tabs>

      <UpgradeProDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        featureName="Users"
        limitMessage={upgradeMessage}
      />
    </>
  );
};

export default UsersPageV2;
