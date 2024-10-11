import { usePrompt } from "@/services/hooks/prompts/prompts";
import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import { ExperimentTable } from "./ExperimentTable";
import { IslandContainer } from "../../../../ui/islandContainer";

interface PromptIdPageProps {
  promptSubversionId?: string;
  experimentId?: string;
}

const ExperimentTablePageEmpty = (props: PromptIdPageProps) => {
  const { promptSubversionId, experimentId } = props;

  return (
    <IslandContainer>
      <div className="flex flex-col w-full space-y-4 pt-4">
        <ExperimentTable
          promptSubversionId={promptSubversionId}
          experimentId={experimentId}
        />
      </div>
    </IslandContainer>
  );
};

export default ExperimentTablePageEmpty;
