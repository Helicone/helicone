import { ExperimentTable } from "./ExperimentTable";

interface ExperimentTablePageEmptyProps {
  experimentTableId?: string;
}

const ExperimentTablePageEmpty = (props: ExperimentTablePageEmptyProps) => {
  const { experimentTableId } = props;

  return (
    <div className="flex flex-col w-full space-y-4 pt-4">
      <ExperimentTable experimentTableId={experimentTableId ?? ""} />
    </div>
  );
};

export default ExperimentTablePageEmpty;
