import { ExperimentTable } from "./ExperimentTable";

interface PromptIdPageProps {
  promptSubversionId?: string;
  experimentId?: string;
}

const ExperimentTablePageEmpty = (props: PromptIdPageProps) => {
  const { promptSubversionId, experimentId } = props;

  return (
    <div className="flex flex-col w-full space-y-4 pt-4">
      <ExperimentTable
        promptSubversionId={promptSubversionId}
        experimentId={experimentId}
      />
    </div>
  );
};

export default ExperimentTablePageEmpty;
