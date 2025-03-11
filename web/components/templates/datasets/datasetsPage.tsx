import { useRouter } from "next/router";
import { useGetHeliconeDatasets } from "../../../services/hooks/dataset/heliconeDataset";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import AuthHeader from "../../shared/authHeader";
import ThemedTable from "../../shared/themed/table/themedTable";
import { useOrg } from "@/components/layout/org/organizationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";

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

  const { datasets, isLoading, isRefetching, refetch } =
    useGetHeliconeDatasets();

  const router = useRouter();

  const org = useOrg();

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col space-y-2 w-full items-center">
          <Skeleton className="w-full h-full" />
        </div>
      ) : datasets?.length === 0 ? (
        <div className="flex flex-col w-full min-h-screen items-center bg-slate-50">
          <EmptyStateCard feature="datasets" />
        </div>
      ) : (
        <>
          <AuthHeader title={"Datasets"} />
          <ThemedTable
            isDatasetsPage={true}
            defaultColumns={[
              {
                header: "Name",
                accessorKey: "name",
              },
              {
                header: "Created At",
                accessorKey: "created_at",
                minSize: 200,
                accessorFn: (row) => {
                  return new Date(row.created_at ?? 0).toLocaleString();
                },
              },
              {
                header: "Dataset Type",
                accessorKey: "dataset_type",
                cell: ({ row }) => {
                  return row.original.dataset_type === "helicone" ? (
                    <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900 px-2 py-1 -my-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20">
                      Helicone
                    </span>
                  ) : row.original.dataset_type === "experiment" ? (
                    <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900 px-2 py-1 -my-1 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
                      Experiment
                    </span>
                  ) : (
                    "Unknown"
                  );
                },
              },
              {
                header: "Rows",
                accessorKey: "requests_count",
                minSize: 200,
              },
            ]}
            defaultData={datasets}
            dataLoading={isLoading}
            id="datasets"
            skeletonLoading={false}
            onRowSelect={(row) => {
              router.push({
                pathname: `/datasets/${row.id}`,
                query: { name: row.name || "Untitled Dataset" },
              });
            }}
            fullWidth={true}
          />
        </>
      )}
    </>
  );
};

export default DatasetsPage;
