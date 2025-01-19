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
import { FilterNode } from "../../../../services/lib/filters/filterDefs";

interface CountryPanelProps {
  timeFilter: TimeFilter;
  userFilters: FilterNode;
}

const CountryPanel = (props: CountryPanelProps) => {
  const { timeFilter, userFilters } = props;

  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(5);

  const { isLoading: isCountriesLoading, countries } = useCountries(
    timeFilter,
    limit,
    userFilters
  );

  const countryMapper = (country: CountryData, index: number) => {
    const countryInfo = COUTNRY_CODE_DIRECTORY.find(
      (c) => c.isoCode === country.country
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
        isDataOverTimeLoading={isCountriesLoading}
      >
        <div className="flex flex-row justify-between items-center pb-2">
          <p className="text-xs font-semibold text-gray-700">Country</p>
          <p className="text-xs font-semibold text-gray-700">Requests</p>
        </div>
        <BarList
          showAnimation={true}
          data={
            countries?.data
              ?.map((country, index) => countryMapper(country, index))
              .sort((a, b) => b.value - a.value - (b.name === "n/a" ? 1 : 0))
              .slice(0, 5) ?? []
          }
          className="overflow-auto h-full"
        />
        <div className="-mt-6 w-full flex justify-center">
          <button
            onClick={() => {
              setLimit(100);
              setOpen(true);
            }}
            className="z-20 flex items-center text-xs text-black dark:text-white bg-white hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5"
          >
            <ArrowsPointingOutIcon className="h-4 w-4 text-gray-500 mr-1" />
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
        <div className="flex flex-col w-[450px] divide-y divide-gray-300 dark:divide-gray-700">
          <div className="flex flex-row justify-between items-end pb-4">
            <h3 className="font-semibold text-xl text-black dark:text-white">
              Countries
            </h3>
            <p className="text-gray-500 text-sm">Requests</p>
          </div>
          <div className="py-4 max-h-96 h-96 overflow-auto">
            <BarList
              showAnimation={true}
              data={
                countries?.data
                  ?.map((country, index) => countryMapper(country, index))
                  .sort(
                    (a, b) => b.value - a.value - (b.name === "n/a" ? 1 : 0)
                  ) ?? []
              }
            />
          </div>
          <div className="pt-4 flex justify-center items-center">
            {" "}
            <button
              onClick={() => {
                setLimit(5);
                setOpen(false);
              }}
              className="z-20 flex w-[200px] justify-center items-center text-xs text-black dark:text-white bg-white hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5"
            >
              <ArrowsPointingInIcon className="h-4 w-4 text-gray-500 mr-1" />
              Close
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default CountryPanel;
