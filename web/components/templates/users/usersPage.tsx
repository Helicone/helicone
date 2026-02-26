import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import FoldedHeader from "@/components/shared/FoldedHeader";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { UserMetric } from "@/lib/api/users/UserMetric";
import { LockIcon, PieChart, Table } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUsers } from "../../../services/hooks/users";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import ThemedTable from "../../shared/themed/table/themedTable";
import { UpgradeProDialog } from "../organization/plan/upgradeProDialog";
import { INITIAL_COLUMNS } from "./initialColumns";
import { UserMetrics } from "./UserMetrics";
import { Small } from "@/components/ui/typography";
import { FilterASTButton } from "@/filterAST/FilterASTButton";
import ViewColumns from "../../shared/themed/table/columns/viewColumns";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { TimeFilter } from "@/types/timeFilter";
import {
  columnDefsToDragColumnItems,
  DragColumnItem,
} from "../../shared/themed/table/columns/DragList";
import { useLocalStorage } from "@/services/hooks/localStorage";
import TableFooter from "../requests/tableFooter";

interface UsersPageV2Props {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}

const TABS = [
  {
    id: "users",
    label: "Users",
    icon: <Table size={16} />,
  },
  {
    id: "metrics",
    label: "Metrics",
    icon: <PieChart size={16} />,
  },
];

function useQueryParam(
  paramName: string,
  defaultValue: string,
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
        { shallow: true },
      );
    },
    [router, paramName],
  );

  const queryParam = searchParams?.get(paramName) || defaultValue;

  useEffect(() => {
    if (!searchParams?.has(paramName)) {
      setQueryParam(defaultValue);
    }
  }, [paramName, defaultValue, searchParams, setQueryParam]);

  return [queryParam, setQueryParam];
}

const UsersPageV2 = (props: UsersPageV2Props) => {
  const {
    currentPage: currentPageProp,
    pageSize: pageSizeProp,
    sort: sortProp,
  } = props;

  const tableRef = useRef<any>(null);
  const router = useRouter();

  const [currentPage, setCurrentPage] = useQueryParam(
    "page",
    currentPageProp.toString(),
  );
  const [pageSize, setPageSize] = useQueryParam(
    "pageSize",
    pageSizeProp.toString(),
  );
  const [sortDirection, setSortDirection] = useQueryParam(
    "sortDirection",
    sortProp.sortDirection ?? "desc",
  );
  const [sortKey, setSortKey] = useQueryParam("sortKey", "last_active");
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useLocalStorage<
    (typeof TABS)[number]["id"]
  >("user-details-tab", "users");

  const [timeFilter, setTimeFilter] = useState<TimeFilter>({
    start: getTimeIntervalAgo("1m"),
    end: new Date(),
  });

  const sortLeaf: SortLeafRequest = {
    [sortKey]: sortDirection as SortDirection,
  };

  const { userMetrics } = useUsers(
    parseInt(currentPage, 10),
    parseInt(pageSize, 10),
    sortLeaf,
    timeFilter,
  );

  const { hasAccess, freeLimit, upgradeMessage, canCreate } = useFeatureLimit(
    "users",
    userMetrics.data?.count ?? 0,
  );

  const onTimeSelectHandler = (key: string, value: string) => {
    if (key === "custom") {
      const [startDate, endDate] = value.split("_");
      setTimeFilter({
        start: new Date(startDate),
        end: new Date(endDate),
      });
    } else {
      setTimeFilter({
        start: getTimeIntervalAgo(key as TimeInterval),
        end: new Date(),
      });
    }
  };

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
              userMetrics.data?.users?.findIndex(
                (u: { user_id: string }) => u.user_id === user.user_id,
              ) ?? 0;
            const isPremium = userIndex >= freeLimit;

            return (
              <span
                className={`font-medium text-gray-900 dark:text-gray-100 ${
                  isPremium ? "opacity-70" : ""
                }`}
              >
                {isPremium && (
                  <LockIcon className="mr-1 inline h-3 w-3 text-muted-foreground" />
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
              userMetrics.data?.users?.findIndex(
                (u: { user_id: string }) => u.user_id === user.user_id,
              ) ?? 0;
            const isPremium = userIndex >= freeLimit;

            if (isPremium) {
              return (
                <span className="select-none opacity-70 blur-sm">••••••••</span>
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

  const [activeColumns, setActiveColumns] = useState<DragColumnItem[]>(
    columnDefsToDragColumnItems(columns),
  );

  const handleRowSelect = (row: UserMetric) => {
    if (hasAccess) {
      router.push(`/users/${encodeURIComponent(row.user_id)}`);
      return;
    }

    const userIndex =
      userMetrics.data?.users?.findIndex(
        (u: { user_id: string }) => u.user_id === row.user_id,
      ) ?? 0;
    const isPremiumUser = userIndex >= freeLimit;

    if (isPremiumUser) {
      setUpgradeDialogOpen(true);
      return;
    }

    router.push(`/users/${encodeURIComponent(row.user_id)}`);
  };

  const hasNoUsers = useMemo(() => {
    return userMetrics.data?.hasUsers === false;
  }, [userMetrics]);

  if (hasNoUsers && !userMetrics.isLoading) {
    return (
      <div className="flex h-screen w-full flex-col bg-background dark:bg-sidebar-background">
        <div className="flex h-full flex-1">
          <EmptyStateCard feature="users" />
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <Tabs
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value)}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <FoldedHeader
          leftSection={
            <section className="flex flex-row items-center gap-2">
              <Link href="/users" className="no-underline">
                <Small className="font-semibold">Users</Small>
              </Link>
              <Small className="font-semibold">/</Small>

              <ThemedTimeFilter
                currentTimeFilter={timeFilter}
                timeFilterOptions={[]}
                onSelect={onTimeSelectHandler}
                isFetching={userMetrics.isLoading}
                defaultValue={"1m"}
                custom={true}
              />

              <FilterASTButton />
            </section>
          }
          rightSection={
            <section className="flex flex-row items-center gap-2">
              <div className="flex h-8 flex-row items-center divide-x divide-border overflow-hidden rounded-lg border border-border shadow-sm">
                <label className="px-2 py-1 text-xs">Views</label>

                <TabsList
                  size={"sm"}
                  variant={"secondary"}
                  asPill={"none"}
                  className="divide-x divide-border"
                >
                  {TABS.map((tab) => (
                    <TabsTrigger
                      variant={"secondary"}
                      asPill={"none"}
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 bg-sidebar-background dark:bg-sidebar-foreground"
                    >
                      {tab.icon}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <ViewColumns
                columns={tableRef.current?.getAllColumns() || []}
                activeColumns={activeColumns}
                setActiveColumns={setActiveColumns}
              />
            </section>
          }
          showFold={false}
        />

        {!canCreate && (
          <FreeTierLimitBanner
            feature="users"
            itemCount={userMetrics.data?.count ?? 0}
            freeLimit={freeLimit}
            className="w-full"
          />
        )}

        <TabsContent value="users" className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-auto">
            <ThemedTable
              id="users-table"
              tableRef={tableRef}
              defaultData={userMetrics.data?.users ?? []}
              defaultColumns={columns}
              skeletonLoading={userMetrics.isLoading}
              dataLoading={userMetrics.isLoading}
              activeColumns={activeColumns}
              setActiveColumns={setActiveColumns}
              rowLink={(row: UserMetric) =>
                `/users/${encodeURIComponent(row.user_id)}`
              }
              onRowSelect={handleRowSelect}
            />
          </div>

          <TableFooter
            currentPage={parseInt(currentPage, 10)}
            pageSize={parseInt(pageSize, 10)}
            isCountLoading={userMetrics.isLoading}
            count={userMetrics.data?.count || 0}
            onPageChange={(n) => setCurrentPage(n.toString())}
            onPageSizeChange={(n) => setPageSize(n.toString())}
           pageSizeOptions={[25, 50, 100, 250, 500]}
          />
        </TabsContent>
        <TabsContent value="metrics" className="h-full">
          <UserMetrics />
        </TabsContent>
      </Tabs>

      <UpgradeProDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        featureName="Users"
        limitMessage={upgradeMessage}
      />
    </main>
  );
};

export default UsersPageV2;
