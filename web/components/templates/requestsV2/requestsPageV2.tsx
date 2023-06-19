import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { clsx } from "../../shared/clsx";
import ThemedTableV5 from "./themedTableV5";
import { getUSDate } from "../../shared/utils/utils";
import ModelPill from "./modelPill";
import AuthHeader from "../../shared/authHeader";
import useRequestsPageV2 from "./useRequestsPageV2";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import RequestDrawerV2 from "./requestDrawerV2";
import TableFooter from "./tableFooter";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { useRouter } from "next/router";

interface RequestsPageV2Props {
  currentPage: number;
  pageSize: number;
  sort: SortLeafRequest;
}

const RequestsPageV2 = (props: RequestsPageV2Props) => {
  const { currentPage, pageSize, sort } = props;

  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<NormalizedRequest>();

  const { count, isLoading, requests, properties, refetch } = useRequestsPageV2(
    page,
    currentPageSize,
    sort
  );
  const router = useRouter();

  const onPageSizeChangeHandler = async (newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    refetch();
  };

  const onPageChangeHandler = async (newPageNumber: number) => {
    setPage(newPageNumber);
    refetch();
  };

  const defaultColumns: ColumnDef<NormalizedRequest>[] = [
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: (info) => (
        <span className="text-gray-900 font-medium">
          {getUSDate(info.getValue() as string)}
        </span>
      ),
      meta: {
        sortKey: "created_at",
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) =>
        (info.getValue() as number) === 200 ? (
          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            Success
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            {`${info.getValue()} Error`}
          </span>
        ),
      size: 100,
    },
    {
      accessorKey: "requestText",
      header: "Request",
      cell: (info) => info.getValue(),
      meta: {
        sortKey: "request_prompt",
      },
    },
    {
      accessorKey: "responseText",
      header: "Response",
      cell: (info) => info.getValue(),
      meta: {
        sortKey: "response_text",
      },
    },
    {
      accessorKey: "model",
      header: "Model",
      cell: (info) => <ModelPill model={info.getValue() as string} />,
      meta: {
        sortKey: "body_model",
      },
    },
    {
      accessorKey: "totalTokens",
      header: "Tokens",
      cell: (info) => info.getValue(),
      meta: {
        sortKey: "total_tokens",
      },
    },
    {
      accessorKey: "latency",
      header: "Latency",
      cell: (info) => <span>{Number(info.getValue()) / 1000}s</span>,
      meta: {
        sortKey: "latency",
      },
    },

    {
      accessorKey: "user",
      header: "User",
      cell: (info) => info.getValue(),
      meta: {
        sortKey: "user_id",
      },
    },
  ];

  const columnsWithProperties = [...defaultColumns].concat(
    properties.map((property) => ({
      accessorFn: (row) =>
        row.customProperties ? row.customProperties[property] : "",
      id: `Custom - ${property}`,
      header: property,
      cell: (info) => info.getValue(),
    }))
  );

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <AuthHeader title={"Requests"} />
          <div className="flex flex-col space-y-4">
            <ThemedTableV5
              defaultData={requests || []}
              defaultColumns={columnsWithProperties}
              sortable={{
                currentSortLeaf: sort,
              }}
              header={{
                onFilter: () => console.log(1),
              }}
              onRowSelect={(row) => {
                setSelectedData(row);
                setOpen(true);
              }}
            />
            <TableFooter
              requestLength={requests.length}
              currentPage={currentPage}
              pageSize={pageSize}
              count={count || 0}
              onPageChange={onPageChangeHandler}
              onPageSizeChange={onPageSizeChangeHandler}
            />
          </div>
          <RequestDrawerV2
            open={open}
            setOpen={setOpen}
            request={selectedData}
            properties={properties}
          />
        </>
      )}
    </div>
  );
};

export default RequestsPageV2;
