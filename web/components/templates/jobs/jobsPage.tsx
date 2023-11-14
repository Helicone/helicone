import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { HeliconeJob } from "../../../lib/api/graphql/client/graphql";
import { HeliconeRequest } from "../../../lib/api/request/request";
import { Result } from "../../../lib/result";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { ThemedSwitch } from "../../shared/themed/themedSwitch";
import { NormalizedRequest } from "../requestsV2/builder/abstractRequestBuilder";
import RequestDrawerV2 from "../requestsV2/requestDrawerV2";
import TableFooter from "../requestsV2/tableFooter";
import { getInitialColumns } from "./initialColumns";
import { useJobPage } from "./useJobPage";
import Link from "next/link";
import LoadingAnimation from "../../shared/loadingAnimation";

interface JobsPageProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}

const JobsPage = (props: JobsPageProps) => {
  const { currentPage, pageSize, sort } = props;
  const [isLive, setIsLive] = useLocalStorage("isLive", false);

  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(100);

  const router = useRouter();
  const {
    count,
    jobs: jobs,
    properties,
    refetch,
    isLoading,
  } = useJobPage(page, currentPageSize, isLive);

  const onPageSizeChangeHandler = async (newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    refetch();
  };

  const onPageChangeHandler = async (newPageNumber: number) => {
    setPage(newPageNumber);
    refetch();
  };

  const columnsWithProperties = [...getInitialColumns()].concat(
    properties.map((property) => {
      return {
        accessorFn: (row) =>
          row.properties
            ? row.properties.find((p) => p?.name === property)?.value
            : null,
        id: `Custom - ${property}`,
        header: property,
        cell: (info) => info.getValue(),
        meta: {
          sortKey: property,
          isCustomProperty: true,
        },
      };
    })
  );

  const cleanJobData = (jobs: HeliconeJob[]) => {
    if (!jobs) return [];

    const copy = jobs.map((job) => {
      const createdAt = Number(job.created_at); // Convert string to number
      const currentTime = Date.now(); // Current time in milliseconds

      const isWithinTimeout = currentTime - createdAt > job.timeout_seconds;

      if (isWithinTimeout && job.status === "PENDING") {
        return {
          ...job,
          status: "TIMEOUT",
        };
      } else {
        return job;
      }
    });
    return copy;
  };

  return (
    <div>
      <AuthHeader
        title={"Jobs"}
        headerActions={
          <div className="flex flex-row gap-2">
            <button
              onClick={() => refetch()}
              className="font-medium text-black dark:text-white text-sm items-center flex flex-row hover:text-sky-700 dark:hover:text-sky-300"
            >
              <ArrowPathIcon
                className={clsx(
                  isLoading ? "animate-spin" : "",
                  "h-5 w-5 inline"
                )}
              />
            </button>
          </div>
        }
        jobs={true}
        actions={
          <>
            <ThemedSwitch checked={isLive} onChange={setIsLive} label="Live" />
          </>
        }
      />
      <div className="flex flex-col space-y-4">
        {jobs.loading ? (
          <LoadingAnimation title="Loading jobs" />
        ) : (
          <ThemedTableV5
            defaultData={cleanJobData(
              (jobs.data?.heliconeJob as HeliconeJob[]) || []
            )}
            defaultColumns={columnsWithProperties}
            tableKey="jobsColumnVisibility"
            dataLoading={isLoading}
            sortable={sort}
            onRowSelect={(row) => {
              router.push(`/jobs/${row.id}`, undefined, { shallow: true });
            }}
            noDataCTA={
              <Link
                href="https://docs.helicone.ai/features/jobs/quick-start"
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded"
              >
                Get started
              </Link>
            }
          />
        )}
        {/* <TableFooter
          currentPage={currentPage}
          pageSize={pageSize}
          isCountLoading={isLoading}
          count={count || 0}
          onPageChange={onPageChangeHandler}
          onPageSizeChange={onPageSizeChangeHandler}
          pageSizeOptions={[10, 25, 50, 100]}
        /> */}
      </div>
    </div>
  );
};

export default JobsPage;
