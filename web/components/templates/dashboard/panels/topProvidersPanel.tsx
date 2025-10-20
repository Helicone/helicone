import StyledAreaChart from "../styledAreaChart";
import { sortAndColorData } from "./utils";
import { useExpandableBarList } from "./barListPanel";

interface TopProvidersPanelProps {
  providers: {
    data:
      | {
          provider: string;
          total_requests: number;
        }[]
      | undefined;
    isLoading: boolean;
  };
}

const TopProvidersPanel = (props: TopProvidersPanelProps) => {
  const { providers } = props;

  const providerData = sortAndColorData(
    providers?.data?.map((provider) => ({
      name: provider.provider,
      value: provider.total_requests,
    })),
  );

  const maxValue = providerData[0]?.value || 1;

  const { expandButton, barList, modal } = useExpandableBarList({
    data: providerData,
    maxValue,
    formatValue: (value) => value.toLocaleString(),
    modalTitle: "Top Providers",
    modalValueLabel: "Requests",
  });

  return (
    <>
      <StyledAreaChart
        title={`Top Providers`}
        value={undefined}
        isDataOverTimeLoading={providers.isLoading}
        withAnimation={true}
        headerAction={expandButton}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex flex-row items-center justify-between pb-2">
            <p className="text-xs font-semibold text-slate-700">Provider</p>
            <p className="text-xs font-semibold text-slate-700">Requests</p>
          </div>
          <div className="flex-grow overflow-y-auto">{barList}</div>
        </div>
      </StyledAreaChart>
      {modal}
    </>
  );
};

export default TopProvidersPanel;
