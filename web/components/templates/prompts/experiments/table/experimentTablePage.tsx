import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import { ExperimentTable } from "./ExperimentTable";

interface PromptIdPageProps {
  id: string;
  promptSubversionId: string;
  experimentId: string;
}

const ExperimentTablePage = (props: PromptIdPageProps) => {
  const { id, promptSubversionId, experimentId } = props;

  return (
    <>
      <div className="flex flex-col w-full space-y-4">
        <HcBreadcrumb
          pages={[
            {
              href: "/prompts",
              name: "Prompts",
            },
          ]}
        />
        <ExperimentTable
          promptSubversionId={promptSubversionId}
          experimentId={experimentId}
        />
      </div>
    </>
  );
};

export default ExperimentTablePage;
