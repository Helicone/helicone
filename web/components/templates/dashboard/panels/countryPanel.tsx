import { BarList } from "@tremor/react";
import StyledAreaChart from "../styledAreaChart";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import { useCountries } from "../../../../services/hooks/country";
import { TimeFilter } from "@/types/timeFilter";
import { COUTNRY_CODE_DIRECTORY } from "../../requests/countryCodeDirectory";
import { CountryData } from "../../../../services/lib/country";
import ThemedModal from "../../../shared/themed/themedModal";
import { useState } from "react";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getMockCountries } from "../mockDashboardData";

interface CountryPanelProps {
  timeFilter: TimeFilter;
  userFilters: FilterNode;
}

const CountryPanel = (props: CountryPanelProps) => {
  const { timeFilter, userFilters } = props;
  const org = useOrg();
  const shouldShowMockData = org?.currentOrg?.has_onboarded === false;

  const [open, setOpen] = useState(false);
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
      name: `${countryInfo?.country} (${countryInfo?.isoCode})` || "n/a",
      value: country.total_requests,
      icon: function TwitterIcon() {
        return <div className="pr-2">{countryInfo?.emojiFlag}</div>;
      },
    };
  };

  return (
    <>
      <StyledAreaChart
        title={`Top Countries`}
        value={undefined}
        isDataOverTimeLoading={isCountriesLoading && !shouldShowMockData}
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <p className="text-xs font-semibold text-gray-700">Country</p>
          <p className="text-xs font-semibold text-gray-700">Requests</p>
        </div>
        <BarList
          showAnimation={true}
          data={
            countries?.data
              ?.map((country) => countryMapper(country))
              .sort((a, b) => b.value - a.value - (b.name === "n/a" ? 1 : 0))
              .slice(0, 5) ?? []
          }
          className="h-full overflow-auto"
        />
        <div className="-mt-6 flex w-full justify-center">
          <button
            onClick={() => {
              setLimit(100);
              setOpen(true);
            }}
            className="z-20 flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-black hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
          >
            <ArrowsPointingOutIcon className="mr-1 h-4 w-4 text-gray-500" />
            Show All
          </button>
        </div>
      </StyledAreaChart>
      <ThemedModal
        open={open}
        setOpen={(open) => {
          if (open === false) {
            setLimit(5);
          }
          setOpen(open);
        }}
      >
        <div className="flex w-[450px] flex-col divide-y divide-gray-300 dark:divide-gray-700">
          <div className="flex flex-row items-end justify-between pb-4">
            <h3 className="text-xl font-semibold text-black dark:text-white">
              Countries
            </h3>
            <p className="text-sm text-gray-500">Requests</p>
          </div>
          <div className="h-96 max-h-96 overflow-auto py-4">
            <BarList
              showAnimation={true}
              data={
                countries?.data
                  ?.map((country) => countryMapper(country))
                  .sort(
                    (a, b) => b.value - a.value - (b.name === "n/a" ? 1 : 0),
                  ) ?? []
              }
            />
          </div>
          <div className="flex items-center justify-center pt-4">
            {" "}
            <button
              onClick={() => {
                setLimit(5);
                setOpen(false);
              }}
              className="z-20 flex w-[200px] items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-black hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
            >
              <ArrowsPointingInIcon className="mr-1 h-4 w-4 text-gray-500" />
              Close
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default CountryPanel;
