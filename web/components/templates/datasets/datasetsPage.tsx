import { useRouter } from "next/router";
import { useGetHeliconeDatasets } from "../../../services/hooks/dataset/heliconeDataset";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import AuthHeader from "../../shared/authHeader";
import ThemedTable from "../../shared/themed/table/themedTable";

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

  return (
    <>
      <AuthHeader title={"Datasets"} />

      <ThemedTable
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
        ]}
        defaultData={datasets}
        dataLoading={isLoading}
        id="datasets"
        skeletonLoading={false}
        onRowSelect={(row) => {
          router.push(`/datasets/${row.id}`);
        }}
      />
    </>
  );
};

export default DatasetsPage;
