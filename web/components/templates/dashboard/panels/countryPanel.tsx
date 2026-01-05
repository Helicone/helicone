import StyledAreaChart from "../styledAreaChart";
import { useCountries } from "../../../../services/hooks/country";
import { TimeFilter } from "@/types/timeFilter";
import { COUTNRY_CODE_DIRECTORY } from "../../requests/countryCodeDirectory";
import { CountryData } from "../../../../services/lib/country";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getMockCountries } from "../mockDashboardData";
import { sortAndColorData } from "./utils";
import { useExpandableBarList } from "./barListPanel";
import { useState } from "react";

interface CountryPanelProps {
  timeFilter: TimeFilter;
  userFilters: FilterNode;
}

const CountryPanel = (props: CountryPanelProps) => {
  const { timeFilter, userFilters } = props;
  const org = useOrg();
  const shouldShowMockData = org?.currentOrg?.has_onboarded === false;

  const [limit, setLimit] = useState(5);

  const { isLoading: isCountriesLoading, countries: realCountries } =
    useCountries(timeFilter, limit, userFilters);

  // Get mock data when user hasn't onboarded
  const mockCountries = shouldShowMockData ? getMockCountries() : null;

  // Use either mock or real data
  const countries = shouldShowMockData ? mockCountries : realCountries;

  const countryMapper = (country: CountryData) => {
    const countryInfo = COUTNRY_CODE_DIRECTORY.find(
      (c) => c.isoCode === country.country,
    );

    return {
      name: `${countryInfo?.emojiFlag || ""} ${countryInfo?.country || "n/a"} (${countryInfo?.isoCode || "n/a"})`,
      value: country.total_requests,
    };
  };

  const countryData = sortAndColorData(
    countries?.data?.map((country) => countryMapper(country)),
    "default",
  );

  const maxValue = countryData[0]?.value || 1;

  const { expandButton, barList, modal } = useExpandableBarList({
    data: countryData,
    maxValue,
    formatValue: (value) => value.toLocaleString(),
    modalTitle: "Top Countries",
    modalValueLabel: "Requests",
  });

  return (
    <>
      <StyledAreaChart
        title={`Top Countries`}
        value={undefined}
        isDataOverTimeLoading={isCountriesLoading && !shouldShowMockData}
        withAnimation={true}
        headerAction={expandButton}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex flex-row items-center justify-between pb-2">
            <p className="text-xs font-semibold text-foreground">Country</p>
            <p className="text-xs font-semibold text-foreground">Requests</p>
          </div>
          <div className="flex-grow overflow-y-auto">{barList}</div>
        </div>
      </StyledAreaChart>
      {modal}
    </>
  );
};

export default CountryPanel;
