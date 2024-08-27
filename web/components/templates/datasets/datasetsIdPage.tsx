import { useState } from "react";
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
import GenericButton from "../../layout/common/button";
import { MinusIcon } from "@heroicons/react/24/outline";
import { Row } from "../../layout/common";
import useShiftKeyPress from "../../../services/hooks/isShiftPressed";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";
import { useSelectMode } from "../../../services/hooks/dataset/selectMode";

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
  const { rows, isLoading, refetch } = useGetHeliconeDatasetRows(id);
  const { datasets, isLoading: isLoadingDataset } = useGetHeliconeDatasets([
    id,
  ]);
  const { setNotification } = useNotification();
  const jawn = useJawnClient();

  const [selectedRow, setSelectedRow] = useState<DatasetRow>(null);
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [lastSelectedRow, setLastSelectedRow] = useState<any | null>(null);
  const [selectedDataIndex, setSelectedDataIndex] = useState<number>();
  const [open, setOpen] = useState(false);
  const isShiftPressed = useShiftKeyPress();

  const {
    selectMode: selectModeHook,
    toggleSelectMode,
    selectedIds,
    toggleSelection,
    selectAll,
    isShiftPressed: isShiftPressedHook,
  } = useSelectMode({
    items: rows,
    getItemId: (row) => row.id,
  });

  const onRowSelectHandler = (row: any, index: number) => {
    if (selectModeHook) {
      toggleSelection(row);
    } else {
      setSelectedDataIndex(index);
      setSelectedRow(row);
      setOpen(true);
    }
  };

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
                <HcBadge title={`${rows?.length || 0} rows`} size={"sm"} />
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
        >
          {selectModeHook && (
            <Row className="gap-5 items-center w-full bg-white dark:bg-black rounded-lg p-5 border border-gray-300 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                Select Mode:
              </span>
              {isShiftPressedHook && lastSelectedRow && (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {lastSelectedRow.id} - {selectedIds[selectedIds.length - 1]}
                </span>
              )}

              <GenericButton
                onClick={selectAll}
                text={selectedIds.length > 0 ? "Deselect All" : "Select All"}
              />
              <GenericButton
                onClick={() => toggleSelectMode(false)}
                text="Cancel"
              />
              {selectedIds.length > 0 && (
                <GenericButton
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
                  icon={
                    <MinusIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                  }
                  text="Remove requests"
                  count={selectedIds.length}
                />
              )}
            </Row>
          )}
        </ThemedTable>
      </div>
      <ThemedDrawer
        open={!!selectedRow}
        setOpen={(open) => setSelectedRow(open ? selectedRow : null)}
        defaultWidth="w-[80vw]"
        defaultExpanded={true}
      >
        <EditDataset selectedRow={selectedRow} />
      </ThemedDrawer>
    </>
  );
};

export default DatasetIdPage;
