import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useState } from "react";
import { HeliconeJob } from "../../../lib/api/graphql/client/graphql";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { SortDirection } from "../../../services/lib/sorts/requests/sorts";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { ThemedSwitch } from "../../shared/themed/themedSwitch";
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
                className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
};

export default JobsPage;
