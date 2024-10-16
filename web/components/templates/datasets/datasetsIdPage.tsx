import { useCallback, useEffect, useState, useMemo } from "react";
import {
  fetchHeliconeDatasetRows,
  useGetHeliconeDatasetRows,
  useGetHeliconeDatasets,
} from "../../../services/hooks/dataset/heliconeDataset";
import ThemedTable from "../../shared/themed/table/themedTable";
import HcBadge from "../../ui/hcBadge";
import HcBreadcrumb from "../../ui/hcBreadcrumb";
import {
  getGenericRequestText,
  getGenericResponseText,
} from "../requestsV2/helpers";
import DatasetButton from "../requestsV2/buttons/datasetButton";
import {
  FolderPlusIcon,
  Square2StackIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Row } from "../../layout/common";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";
import { useSelectMode } from "../../../services/hooks/dataset/selectMode";
import { useRouter } from "next/router";
import TableFooter from "../requestsV2/tableFooter";
import { clsx } from "../../shared/clsx";
import { useOrg } from "../../layout/organizationContext";
import ExportButton from "../../shared/themed/table/exportButton";
import NewDataset from "./NewDataset";
import ThemedModal from "../../shared/themed/themedModal";
import GenericButton from "../../layout/common/button";
import DatasetDrawerV2 from "./datasetDrawer";
import RemoveRequestsModal from "./RemoveRequests";
import { useIntegration } from "@/services/hooks/useIntegrations";
import OpenPipeFineTuneButton from "../connections/openPipe/fineTuneDatasetButton";
import AuthHeader from "../../shared/authHeader";

interface DatasetIdPageProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

export type DatasetRow =
  | ReturnType<typeof useGetHeliconeDatasetRows>["rows"][number]
  | null;
const DatasetIdPage = (props: DatasetIdPageProps) => {
  const { id, currentPage, pageSize } = props;
  const router = useRouter();
  const org = useOrg();
  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);

  const { rows, isLoading, refetch, count, isCountLoading } =
    useGetHeliconeDatasetRows(id, page, currentPageSize);
  const { datasets, isLoading: isLoadingDataset } = useGetHeliconeDatasets([
    id,
  ]);
  const { setNotification } = useNotification();
  const jawn = useJawnClient();

  const [selectedRow, setSelectedRow] = useState<DatasetRow>(null);

  const openPipeIntegration = useIntegration("open_pipe");

  const [open, setOpen] = useState(false);
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const {
    selectMode: selectModeHook,
    toggleSelectMode,
    selectedIds,
    toggleSelection,
    selectAll,
    deselectAll,
  } = useSelectMode({
    items: rows,
    getItemId: (row) => row.id,
  });

  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Use useMemo to derive selectedRequestIds
  const selectedRequestIds = useMemo(() => {
    return rows
      .filter((row) => selectedIds.includes(row.id))
      .map((row) => ({
        id: row.id,
        origin_request_id: row.origin_request_id,
      }));
  }, [rows, selectedIds]);

  const onRowSelectHandler = useCallback(
    (row: any) => {
      if (selectModeHook) {
        toggleSelection(row);
      } else {
        setSelectedRow(row);
        setSelectedRowIndex(rows.findIndex((r) => r.id === row.id));
        setOpen(true);
      }
    },
    [selectModeHook, toggleSelection, rows]
  );

  const handlePrevious = () => {
    if (selectedRowIndex !== null && selectedRowIndex > 0) {
      setSelectedRowIndex(selectedRowIndex - 1);
      setSelectedRow(rows[selectedRowIndex - 1]);
    }
  };

  const handleNext = () => {
    if (selectedRowIndex !== null && selectedRowIndex < rows.length - 1) {
      setSelectedRowIndex(selectedRowIndex + 1);
      setSelectedRow(rows[selectedRowIndex + 1]);
    }
  };

  const handleSelectAll = useCallback(
    (isSelected: boolean) => {
      selectAll();
    },
    [selectAll]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, page: newPage.toString() },
        },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  useEffect(() => {
    const pageFromQuery = router.query.page;
    if (pageFromQuery && !Array.isArray(pageFromQuery)) {
      const parsedPage = parseInt(pageFromQuery, 10);
      if (!isNaN(parsedPage) && parsedPage !== page) {
        setPage(parsedPage);
      }
    }
  }, [router.query.page, page]);

  const handleDuplicateRequests = async () => {
    try {
      const res = await jawn.POST(`/v1/helicone-dataset/{datasetId}/mutate`, {
        params: {
          path: {
            datasetId: id,
          },
        },
        body: {
          addRequests: selectedRequestIds.map((item) => item.origin_request_id),
          removeRequests: [],
        },
      });
      if (res.data && !res.data.error) {
        setNotification("Requests duplicated to this dataset", "success");
        await refetch();
      } else {
        setNotification(
          "Failed to duplicate requests to this dataset",
          "error"
        );
      }
    } catch (error) {
      setNotification("Failed to duplicate requests to this dataset", "error");
    }
  };

  const handleRemoveRequests = async () => {
    try {
      const res = await jawn.POST(`/v1/helicone-dataset/{datasetId}/mutate`, {
        params: {
          path: {
            datasetId: id,
          },
        },
        body: {
          addRequests: [],
          removeRequests: selectedRequestIds.map((item) => item.id),
        },
      });
      if (res.data && !res.data.error) {
        setNotification("Requests removed from dataset", "success");
        await refetch();
        deselectAll();

        toggleSelectMode(false);
      } else {
        setNotification("Failed to remove requests from dataset", "error");
      }
    } catch (error) {
      setNotification("Failed to remove requests from dataset", "error");
    }
  };

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setCurrentPageSize(newPageSize);
      setPage(1); // Reset to first page when changing page size
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            page: "1",
            pageSize: newPageSize.toString(),
          },
        },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  const exportedData = useCallback(async () => {
    const rows = await fetchHeliconeDatasetRows(
      org?.currentOrg?.id || "",
      id,
      1,
      500
    );
    return rows.map((row) => {
      return {
        ...(typeof row.request_body === "object" ? row.request_body : {}),
        ...(typeof row.response_body === "object" ? row.response_body : {}),
      };
    });
  }, [id, org?.currentOrg?.id]);

  return (
    <>
      <div className="w-full h-full flex flex-col space-y-8">
        <div className="flex flex-row items-center justify-between pl-8">
          <div className="flex flex-col items-start space-y-4 w-full">
            <div className="w-full pt-4">
              <HcBreadcrumb
                pages={[
                  { href: "/datasets", name: "Datasets" },
                  {
                    href: `/datasets/${id}`,
                    name: datasets?.[0]?.name || "Loading...",
                  },
                ]}
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="font-semibold text-4xl text-black dark:text-white">
                  {datasets?.[0]?.name}
                </h1>
                <HcBadge title={`${count || 0} rows`} size={"sm"} />
              </div>
            </div>
          </div>
        </div>
        <ThemedTable
          highlightedIds={selectedIds}
          showCheckboxes={selectModeHook}
          fullWidth={true}
          defaultColumns={[
            {
              header: "Created At",
              accessorKey: "created_at",
              minSize: 200,
              accessorFn: (row) => {
                return new Date(row.created_at ?? 0).toLocaleString();
              },
            },
            {
              header: "Request Body",
              accessorKey: "request_body",
              cell: ({ row }) => {
                return getGenericRequestText(
                  row.original.request_response_body?.request
                );
              },
              size: 500,
            },
            {
              header: "Response Body",
              accessorKey: "response_body",
              size: 500,
              cell: ({ row }) => {
                const responseText = getGenericResponseText(
                  row.original.request_response_body?.response,
                  200
                );
                return (
                  <div
                    onClick={() => navigator.clipboard.writeText(responseText)}
                    className="cursor-pointer"
                    title="Click to copy"
                  >
                    {responseText}
                  </div>
                );
              },
            },
          ]}
          defaultData={rows}
          dataLoading={isLoading}
          id="datasets"
          skeletonLoading={false}
          onRowSelect={onRowSelectHandler}
          customButtons={[
            <ExportButton
              key="export-button"
              rows={rows}
              fetchRows={exportedData}
            />,
            <div key={"dataset-button"}>
              <DatasetButton
                datasetMode={selectModeHook}
                setDatasetMode={toggleSelectMode}
                isDatasetPage={true}
                items={rows.filter((request) =>
                  selectedIds.includes(request.id)
                )}
                onAddToDataset={() => {
                  rows
                    .filter((row) => selectedIds.includes(row.id))
                    .forEach(toggleSelection);
                  toggleSelectMode(false);
                }}
              />
            </div>,
            openPipeIntegration.integration?.active && (
              <div key={"open-pipe-button"}>
                <OpenPipeFineTuneButton
                  datasetId={id}
                  rows={rows}
                  datasetName={datasets?.[0]?.name || ""}
                  fetchRows={async () => {
                    const allRows = await fetchHeliconeDatasetRows(
                      org?.currentOrg?.id || "",
                      id,
                      1,
                      count || 0
                    );
                    return allRows;
                  }}
                />
              </div>
            ),
          ]}
          onSelectAll={handleSelectAll}
          selectedIds={selectedIds}
        >
          {selectModeHook && (
            <Row className="gap-5 items-center w-full justify-between bg-white dark:bg-black p-5">
              <div className="flex flex-row gap-2 items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  Dataset Selection:
                </span>
                <span className="text-sm p-2 rounded-md font-medium bg-[#F1F5F9] text-[#1876D2] dark:text-gray-100 whitespace-nowrap">
                  {selectedIds.length} selected
                </span>
              </div>
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <GenericButton
                    onClick={() => setShowNewDatasetModal(true)}
                    text="Copy to..."
                    icon={
                      <FolderPlusIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                    }
                  ></GenericButton>
                  <GenericButton
                    onClick={handleDuplicateRequests}
                    text="Duplicate"
                    icon={
                      <Square2StackIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                    }
                  ></GenericButton>
                  <button
                    onClick={() => setShowRemoveModal(true)}
                    className={clsx(
                      "relative inline-flex items-center hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
                    )}
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <TrashIcon className="h-5 w-5 text-gray-100 dark:text-gray-900" />
                      <span>Remove</span>
                    </div>
                  </button>
                </div>
              )}
            </Row>
          )}
        </ThemedTable>

        <TableFooter
          currentPage={page}
          pageSize={currentPageSize}
          isCountLoading={isCountLoading}
          count={count || 0}
          onPageChange={(n) => handlePageChange(n)}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[25, 50, 100, 250, 500]}
        />
      </div>
      <DatasetDrawerV2
        open={open}
        setOpen={setOpen}
        hasPrevious={selectedRowIndex !== null && selectedRowIndex > 0}
        hasNext={
          selectedRowIndex !== null && selectedRowIndex < rows.length - 1
        }
        onPrevHandler={handlePrevious}
        onNextHandler={handleNext}
        selectedRow={selectedRow}
        datasetId={id}
        onDelete={() => {
          setSelectedRow(null);
          setSelectedRowIndex(null);
          refetch();
        }}
        refetch={refetch}
      />
      <ThemedModal open={showNewDatasetModal} setOpen={setShowNewDatasetModal}>
        <NewDataset
          request_ids={selectedRequestIds.map((item) => item.origin_request_id)}
          isCopyMode={true}
          onComplete={() => {
            setShowNewDatasetModal(false);
            toggleSelectMode(false);
            deselectAll();
            refetch();
          }}
        />
      </ThemedModal>
      <RemoveRequestsModal
        open={showRemoveModal}
        setOpen={setShowRemoveModal}
        requestCount={selectedRequestIds.length}
        onConfirm={() => {
          handleRemoveRequests();
          setShowRemoveModal(false);
        }}
      />
    </>
  );
};

export default DatasetIdPage;
