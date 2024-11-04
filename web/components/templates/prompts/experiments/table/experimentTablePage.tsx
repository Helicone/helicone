import { ExperimentTable } from "./ExperimentTable";
import { IslandContainer } from "../../../../ui/islandContainer";
import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import { useExperimentTableMetadata } from "../../../../../services/hooks/prompts/experiments";

interface ExperimentTablePageProps {
  experimentTableId: string;
}

const ExperimentTablePage = (props: ExperimentTablePageProps) => {
  const { experimentTableId } = props;
  const { experiment } = useExperimentTableMetadata({ id: experimentTableId });

  return (
    <div className="flex flex-col w-full space-y-4 pt-4">
      <IslandContainer>
        <HcBreadcrumb
          pages={[
            {
              href: "/experiments",
              name: "Experiments",
            },
            {
              href: `/experiments/${experimentTableId}`,
              name: experiment?.name ?? "Experiment",
            },
          ]}
        />
      </IslandContainer>
      <ExperimentTable experimentTableId={experimentTableId} />
    </div>
  );
};

export default ExperimentTablePage;
