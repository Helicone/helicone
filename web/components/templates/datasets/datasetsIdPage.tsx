import { useCallback, useEffect, useState } from "react";
import {
  useGetHeliconeDatasetRows,
  useGetHeliconeDatasets,
} from "../../../services/hooks/dataset/heliconeDataset";
import ThemedTable from "../../shared/themed/table/themedTable";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import HcBadge from "../../ui/hcBadge";
import HcBreadcrumb from "../../ui/hcBreadcrumb";
import {
  getGenericRequestText,
  getGenericResponseText,
} from "../requestsV2/helpers";
import EditDataset from "./EditDataset";
import DatasetButton from "../requestsV2/buttons/datasetButton";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Row } from "../../layout/common";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";
import { useSelectMode } from "../../../services/hooks/dataset/selectMode";
import { useRouter } from "next/router";
import TableFooter from "../requestsV2/tableFooter";
import { clsx } from "../../shared/clsx";
import NewDataset from "./NewDataset"; // Add this import at the top of the file
import ThemedModal from "../../shared/themed/themedModal";

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
  const [selectedDataIndex, setSelectedDataIndex] = useState<number>();
  const [open, setOpen] = useState(false);
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<Array<{id: string, origin_request_id: string}>>([]);

  const {
    selectMode: selectModeHook,
    toggleSelectMode,
    selectedIds,
    toggleSelection,
    selectAll,
  } = useSelectMode({
    items: rows,
    getItemId: (row) => row.id,
  });

  const onRowSelectHandler = (row: any, index: number) => {
    if (selectModeHook) {
      toggleSelection(row);
      // Update selectedRequestIds when a row is selected or deselected
      setSelectedRequestIds((prev) => {
        const existingIndex = prev.findIndex(item => item.id === row.id);
        if (existingIndex !== -1) {
          // If the row is already selected, remove it
          return prev.filter((_, index) => index !== existingIndex);
        } else {
          // If the row is not selected, add it
          return [...prev, { id: row.id, origin_request_id: row.origin_request_id }];
        }
      });
    } else {
      setSelectedDataIndex(index);
      setSelectedRow(row);
      setOpen(true);
    }
  };

  // Update handleSelectAll
  const handleSelectAll = (isSelected: boolean) => {
    selectAll();
    if (isSelected) {
      setSelectedRequestIds(
        rows
          .map((row) => ({ id: row.id, origin_request_id: row.origin_request_id }))
          .filter((item): item is { id: string, origin_request_id: string } => 
            item.id !== undefined && item.origin_request_id !== undefined)
      );
    } else {
      setSelectedRequestIds([]);
    }
  };

  // Update the page state and router query when the page changes
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

  // Sync the page state with the router query on component mount
  useEffect(() => {
    const pageFromQuery = router.query.page;
    if (pageFromQuery && !Array.isArray(pageFromQuery)) {
      const parsedPage = parseInt(pageFromQuery, 10);
      if (!isNaN(parsedPage) && parsedPage !== page) {
        setPage(parsedPage);
      }
    }
  }, [router.query.page, page]);

  return (
    <>
      <div className="w-full h-full flex flex-col space-y-8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col items-start space-y-4 w-full">
            <HcBreadcrumb
              pages={[
                {
                  href: "/datasets",
                  name: "Datasets",
                },
                {
                  href: `/datasets/${id}`,
                  name: datasets?.[0]?.name || "Loading...",
                },
              ]}
            />
            <div className="flex justify-between w-full">
              <div className="flex gap-4 items-end">
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
          onRowSelect={(row, index) => {
            onRowSelectHandler(row, index);
          }}
          customButtons={[
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
          ]}
          onSelectAll={handleSelectAll}
          selectedIds={selectedIds}
        >
          {selectModeHook && (
            <Row className="gap-5 items-center w-full justify-between bg-white dark:bg-black rounded-lg p-5 border border-gray-300 dark:border-gray-700">
              <div className="flex flex-row gap-2 items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  Select Mode:
                </span>
                <span className="text-sm p-2 rounded-md font-medium bg-[#F1F5F9] text-[#1876D2] dark:text-gray-100 whitespace-nowrap">
                  {selectedIds.length} selected
                </span>
              </div>
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewDatasetModal(true)}
                    className={clsx(
                      "relative inline-flex items-center rounded-md hover:bg-blue-700 bg-blue-500 px-4 py-2 text-sm font-medium text-white"
                    )}
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <span>Copy to...</span>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      const res = await jawn.POST(
                        `/v1/helicone-dataset/{datasetId}/mutate`,
                        {
                          params: {
                            path: {
                              datasetId: id,
                            },
                          },
                          body: {
                            addRequests: selectedRequestIds.map(item => item.origin_request_id),
                            removeRequests: [],
                          },
                        }
                      );
                      console.log("ids", selectedRequestIds);
                      if (res.data && !res.data.error) {
                        setNotification(
                          "Requests duplicated to this dataset",
                          "success"
                        );
                        await refetch();
                      } else {
                        setNotification(
                          "Failed to duplicate requests to this dataset",
                          "error"
                        );
                      }
                      toggleSelectMode(false);
                      setSelectedRequestIds([]); // Clear selection after duplication
                    }}
                    className={clsx(
                      "relative inline-flex items-center rounded-md hover:bg-green-700 bg-green-500 px-4 py-2 text-sm font-medium text-white"
                    )}
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <span>Duplicate</span>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      const res = await jawn.POST(
                        `/v1/helicone-dataset/{datasetId}/mutate`,
                        {
                          params: {
                            path: {
                              datasetId: id,
                            },
                          },
                          body: {
                            addRequests: [],
                            removeRequests: selectedIds,
                          },
                        }
                      );
                      if (res.data && !res.data.error) {
                        setNotification(
                          "Requests removed from dataset",
                          "success"
                        );
                        await refetch();
                      } else {
                        setNotification(
                          "Failed to remove requests from dataset",
                          "error"
                        );
                      }
                      toggleSelectMode(false);
                    }}
                    className={clsx(
                      "relative inline-flex items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
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
          onPageSizeChange={(n) => setCurrentPageSize(n)}
          pageSizeOptions={[25, 50, 100, 250, 500]}
        />
      </div>
      <ThemedDrawer
        open={!!selectedRow}
        setOpen={(open) => setSelectedRow(open ? selectedRow : null)}
        defaultWidth="w-[80vw]"
        defaultExpanded={true}
      >
        <EditDataset selectedRow={selectedRow} />
      </ThemedDrawer>
      <ThemedModal open={showNewDatasetModal} setOpen={setShowNewDatasetModal}>
        <NewDataset
          request_ids={selectedRequestIds.map(item => item.origin_request_id)}
          isCopyMode={true}
          onComplete={() => {
            setShowNewDatasetModal(false);
            toggleSelectMode(false);
            setSelectedRequestIds([]);
            refetch();
          }}
        />
      </ThemedModal>
    </>
  );
};

export default DatasetIdPage;
