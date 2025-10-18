import StyledAreaChart from "../styledAreaChart";
import { sortAndColorData } from "./utils";
import { useExpandableBarList } from "./barListPanel";

interface ModelsPanelProps {
  models: {
    data:
      | {
          model: string;
          total_requests: number;
        }[]
      | undefined;
    isLoading: boolean;
  };
}

const ModelsPanel = (props: ModelsPanelProps) => {
  const { models } = props;

  const modelData = sortAndColorData(
    models?.data?.map((model) => ({
      name: model.model,
      value: model.total_requests,
    })),
    "alt1", // Use alt1 color order
  );

  const maxValue = modelData[0]?.value || 1;

  const { expandButton, barList, modal } = useExpandableBarList({
    data: modelData,
    maxValue,
    formatValue: (value) => value.toLocaleString(),
    modalTitle: "Top Models by Requests",
    modalValueLabel: "Requests",
  });

  return (
    <>
      <StyledAreaChart
        title={`Top Models by Requests`}
        value={undefined}
        isDataOverTimeLoading={models.isLoading}
        withAnimation={true}
        headerAction={expandButton}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex flex-row items-center justify-between pb-2">
            <p className="text-xs font-semibold text-slate-700">Name</p>
            <p className="text-xs font-semibold text-slate-700">Requests</p>
          </div>
          <div className="flex-grow overflow-y-auto">{barList}</div>
        </div>
      </StyledAreaChart>
      {modal}
    </>
  );
};

export default ModelsPanel;
