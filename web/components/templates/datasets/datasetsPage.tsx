import {
  BookOpenIcon,
  CircleStackIcon as DatabaseIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import { useGetHeliconeDatasets } from "../../../services/hooks/dataset/heliconeDataset";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import AuthHeader from "../../shared/authHeader";
import ThemedTable from "../../shared/themed/table/themedTable";
import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";

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
      {!isLoading && datasets.length === 0 ? (
        <div className="flex flex-col w-full mt-12 justify-center items-center">
          <div className="flex flex-col items-center max-w-3xl">
            <DatabaseIcon className="h-12 w-12 text-black dark:text-white" />
            <p className="text-xl text-black dark:text-white font-semibold mt-6">
              No Datasets
            </p>

            <p className="text-sm text-gray-500 max-w-sm mt-2 text-center">
              Create your first dataset to get started. Here&apos;s a quick
              tutorial:
            </p>
            <div className="mt-4 w-full">
              <video
                width="100%"
                height="100%"
                autoPlay
                muted
                loop
                className="rounded-lg shadow-lg"
              >
                <source
                  src="https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/creating-dataset.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="mt-6 flex gap-3">
              <Link
                href="https://docs.helicone.ai/features/datasets"
                className="w-fit items-center rounded-md bg-black px-3 py-2 gap-2 text-sm flex font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                <BookOpenIcon className="h-4 w-4" />
                View Docs
              </Link>
              <ProFeatureWrapper featureName="Create dataset">
                <Link
                  href="/requests"
                  className="w-fit items-center rounded-md bg-blue-600 px-3 py-2 gap-2 text-sm flex font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <DatabaseIcon className="h-4 w-4" />
                  Create Dataset
                </Link>
              </ProFeatureWrapper>
            </div>
          </div>
        </div>
      ) : (
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
            router.push(`/datasets/${row.id}`);
          }}
          fullWidth={true}
        />
      )}
    </>
  );
};

export default DatasetsPage;
