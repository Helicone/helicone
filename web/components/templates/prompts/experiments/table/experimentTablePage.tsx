import { usePrompt } from "@/services/hooks/prompts/prompts";
import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import { ExperimentTable } from "./ExperimentTable";
import { IslandContainer } from "../../../../ui/islandContainer";

interface ExperimentTablePageProps {
  experimentTableId: string;
}

const ExperimentTablePage = (props: ExperimentTablePageProps) => {
  const { experimentTableId } = props;
  // const { prompt } = usePrompt(promptId);

  return (
    <div className="flex flex-col w-full space-y-4 pt-4">
      <IslandContainer>
        {/* <HcBreadcrumb
          pages={[
            {
              href: "/prompts",
              name: "Prompts",
            },
            {
              href: `/prompts/${promptId}`,
              name: prompt?.user_defined_id || "Loading...",
            },
            {
              href: `/prompts/${promptId}/subversion/${promptSubversionId}/experiment/${experimentId}`,
              name: "Experiment",
            },
          ]}
        /> */}
      </IslandContainer>
      <ExperimentTable experimentTableId={experimentTableId} />
    </div>
  );
};

export default ExperimentTablePage;
