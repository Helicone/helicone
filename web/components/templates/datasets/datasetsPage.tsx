import { useGetHeliconeDatasets } from "../../../services/hooks/dataset/heliconeDataset";
import AuthHeader from "../../shared/authHeader";
import { SimpleTable } from "../../shared/table/simpleTable";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import React, { useState } from "react";
import { UpgradeProDialog } from "../../templates/organization/plan/upgradeProDialog";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { SortDirection } from "@/services/lib/sorts/requests/sorts";
import { Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useNavigate } from "react-router";

// Type for the dataset row
type DatasetTableRow = {
  id: string;
  name: string | null;
  created_at: string | null;
  dataset_type: string;
  requests_count: number;
  organization: string;
  meta: any;
  promptVersionId?: any;
};

interface DatasetsPageProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  defaultIndex: number;
}

const DatasetsPage = (props: DatasetsPageProps) => {
  const { currentPage, pageSize, sort, defaultIndex } = props;

  const { datasets, isLoading, refetch, isRefetching, isFetched, status } =
    useGetHeliconeDatasets();

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] =
    useState<DatasetTableRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // For delete functionality
  const jawnClient = useJawnClient();
  const { setNotification } = useNotification();

  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const { canCreate, freeLimit, upgradeMessage } = useFeatureLimit(
    "datasets",
    datasets?.length || 0
  );

  const navigate = useNavigate();

  // Open delete modal
  const handleDeleteClick = (dataset: DatasetTableRow) => {
    setDatasetToDelete(dataset);
    setDeleteModalOpen(true);
  };

  const handleCloseDialog = () => {
    setDeleteModalOpen(false);
    setDatasetToDelete(null);
  };

  // Delete the dataset
  const handleDeleteConfirm = () => {
    if (!datasetToDelete) return;

    setIsDeleting(true);
    jawnClient
      .POST(`/v1/helicone-dataset/{datasetId}/delete`, {
        params: {
          path: {
            datasetId: datasetToDelete.id,
          },
        },
      })
      .then((res) => {
        if (res.error) {
          setNotification("Error deleting dataset", "error");
        } else {
          setNotification("Dataset deleted successfully", "success");
          refetch();
          handleCloseDialog();
        }
      })
      .catch((err) => {
        setNotification("Error deleting dataset", "error");
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  const columns = [
    {
      key: "name" as keyof DatasetTableRow,
      header: "Name",
      render: (row: DatasetTableRow) => row.name || "Untitled Dataset",
    },
    {
      key: "created_at" as keyof DatasetTableRow,
      header: "Created At",
      render: (row: DatasetTableRow) =>
        new Date(row.created_at ?? 0).toLocaleString(),
    },
    {
      key: "dataset_type" as keyof DatasetTableRow,
      header: "Dataset Type",
      render: (row: DatasetTableRow) => {
        return row.dataset_type === "helicone" ? (
          <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900 px-2 py-1 -my-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20">
            Helicone
          </span>
        ) : row.dataset_type === "experiment" ? (
          <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900 px-2 py-1 -my-1 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
            Experiment
          </span>
        ) : (
          "Unknown"
        );
      },
    },
    {
      key: "requests_count" as keyof DatasetTableRow,
      header: "Rows",
      render: (row: DatasetTableRow) => row.requests_count,
    },
    {
      key: undefined,
      header: "",
      render: (row: DatasetTableRow) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleDeleteClick(row);
            return false;
          }}
          className="text-destructive"
        >
          <Trash size={16} />
        </Button>
      ),
    },
  ];

  // Show skeleton during loading or when data hasn't been fetched yet
  if (isLoading || isRefetching || !isFetched) {
    return (
      <div className="flex flex-col space-y-2 w-full items-center">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <>
      {datasets.length === 0 ? (
        <div className="flex flex-col w-full min-h-screen items-center bg-slate-50">
          <EmptyStateCard feature="datasets" />
        </div>
      ) : (
        <>
          <AuthHeader title={"Datasets"} />

          {!canCreate && (
            <FreeTierLimitBanner
              feature="datasets"
              itemCount={datasets.length}
              freeLimit={freeLimit}
            />
          )}

          <SimpleTable
            data={datasets || []}
            columns={columns}
            onSelect={(row) => {
              navigate(
                `/datasets/${row.id}?name=${row.name || "Untitled Dataset"}`
              );
            }}
          />

          {/* Delete Modal - Rendered at the page level, outside of the table */}
          <Dialog open={deleteModalOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Dataset</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the dataset &ldquo;
                  {datasetToDelete?.name || "Untitled Dataset"}
                  &rdquo;? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-row gap-2 justify-end">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <UpgradeProDialog
            open={upgradeDialogOpen}
            onOpenChange={setUpgradeDialogOpen}
            featureName="Datasets"
            limitMessage={upgradeMessage}
          />
        </>
      )}
    </>
  );
};

export default DatasetsPage;
