import { usePrompt } from "@/services/hooks/prompts/prompts";
import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import { ExperimentTable } from "./ExperimentTable";
import { IslandContainer } from "../../../../ui/islandContainer";
import { ExperimentTableNew } from "./ExperimentTableNew";

interface PromptIdPageProps {
  promptId: string;
  promptSubversionId: string;
  experimentId: string;
}

const ExperimentTablePage = (props: PromptIdPageProps) => {
  const { promptId, promptSubversionId, experimentId } = props;
  const { prompt } = usePrompt(promptId);

  return (
    <div className="flex flex-col w-full space-y-4 pt-4">
      <IslandContainer>
        <HcBreadcrumb
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
        />
      </IslandContainer>
      <ExperimentTableNew
        promptSubversionId={promptSubversionId}
        experimentId={experimentId}
      />
    </div>
  );
};

export default ExperimentTablePage;
