import { usePrompt } from "@/services/hooks/prompts/prompts";
import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import { ExperimentTable } from "./ExperimentTable";
import { IslandContainer } from "../../../../ui/islandContainer";
import AuthHeader from "../../../../shared/authHeader";
import { useExperiments } from "../../../../../services/hooks/prompts/experiments";
import ThemedTable from "../../../../shared/themed/table/themedTable";
import { useRouter } from "next/router";

interface ExperimentsPageProps {}

const ExperimentsPage = (props: ExperimentsPageProps) => {
  const router = useRouter();
  const { experiments, isLoading } = useExperiments({
    page: 1,
    pageSize: 25,
  });

  return (
    <>
      <AuthHeader title={"Experiments"} />
      <ThemedTable
        defaultColumns={[
          {
            header: "Name",
            accessorKey: "datasetName",
          },
          {
            header: "Created At",
            accessorKey: "created_at",
            minSize: 200,
            accessorFn: (row) => {
              return new Date(row.createdAt ?? 0).toLocaleString();
            },
          },

          {
            header: "Rows",
            accessorKey: "requests_count",
            minSize: 200,
          },
        ]}
        defaultData={experiments}
        dataLoading={isLoading}
        id="experiments"
        skeletonLoading={false}
        onRowSelect={(row) => {
          router.push(`/experiments/${row.id}`);
        }}
        fullWidth={true}
      />
    </>
  );
};

export default ExperimentsPage;
