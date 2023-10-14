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
import getRequestBuilder from "../requestsV2/builder/requestBuilder";
import RequestDrawerV2 from "../requestsV2/requestDrawerV2";
import TableFooter from "../requestsV2/tableFooter";
import { getInitialColumns } from "./initialColumns";
import { useJobPage } from "./useJobPage";
import Link from "next/link";

interface JobsPageProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  isCached?: boolean;
  initialRequestId?: string;
}

const JobsPage = (props: JobsPageProps) => {
  const {
    currentPage,
    pageSize,
    sort,
    isCached = false,
    initialRequestId,
  } = props;
  const [isLive, setIsLive] = useLocalStorage("isLive", false);

  // set the initial selected data on component load
  useEffect(() => {
    if (initialRequestId) {
      const fetchRequest = async () => {
        const resp = await fetch(`/api/request/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filter: {
              left: {
                request: {
                  id: {
                    equals: initialRequestId,
                  },
                },
              },
              operator: "and",
              right: "all",
            } as FilterNode,
            offset: 0,
            limit: 1,
            sort: {},
          }),
        })
          .then(
            (res) => res.json() as Promise<Result<HeliconeRequest[], string>>
          )
          .then((res) => {
            const { data, error } = res;
            if (data !== null && data.length > 0) {
              const normalizedRequest = getRequestBuilder(data[0]).build();
              setSelectedData(normalizedRequest);
              setOpen(true);
            }
          });
      };
      fetchRequest();
    }
  }, [initialRequestId]);

  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<
    NormalizedRequest | undefined
  >(undefined);

  const router = useRouter();
  const {
    count,
    jobs: jobs,
    properties,
    refetch,
    loading,
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

  const onRowSelectHandler = (row: NormalizedRequest) => {
    setSelectedData(row);
    setOpen(true);
    router.push(
      {
        pathname: "/requests",
        query: { ...router.query, requestId: row.id },
      },
      undefined,
      {}
    );
  };

  return (
    <div>
      <AuthHeader
        title={"Jobs"}
        headerActions={
          <div className="flex flex-row gap-2">
            <button
              onClick={() => refetch()}
              className="font-medium text-black text-sm items-center flex flex-row hover:text-sky-700"
            >
              <ArrowPathIcon
                className={clsx(
                  loading ? "animate-spin" : "",
                  "h-5 w-5 inline"
                )}
              />
            </button>
            <i>
              {"In ~beta~, please use with caution and sorry for any bugs :)"}
            </i>
          </div>
        }
        actions={
          <>
            <ThemedSwitch checked={isLive} onChange={setIsLive} label="Live" />
          </>
        }
      />
      <div className="flex flex-col space-y-4">
        <ThemedTableV5
          defaultData={(jobs.data?.heliconeJob || []) as HeliconeJob[]}
          defaultColumns={columnsWithProperties}
          tableKey="requestsColumnVisibility"
          dataLoading={loading}
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
        <TableFooter
          currentPage={currentPage}
          pageSize={pageSize}
          isCountLoading={loading}
          count={count || 0}
          onPageChange={onPageChangeHandler}
          onPageSizeChange={onPageSizeChangeHandler}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
      <RequestDrawerV2
        open={open}
        setOpen={setOpen}
        request={selectedData}
        properties={properties}
      />
    </div>
  );
};

export default JobsPage;
