import { useState } from "react";

import {
  getTimeInterval,
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { MultiSelect, MultiSelectItem, Text } from "@tremor/react";

import AuthHeader from "../../shared/authHeader";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { ThemedMultiSelect } from "../../shared/themed/themedMultiSelect";
import { ThemedPill } from "../../shared/themed/themedPill";
import { useGetProperties } from "../../../services/hooks/properties";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import PropertyCard from "./propertyCard";
import {
  ArrowPathIcon,
  CalculatorIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";
import useSearchParams from "../../shared/utils/useSearchParams";
import React from "react";

const PropertiesPage = (props: {}) => {
  const searchParams = useSearchParams();

  const getInterval = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  const [interval, setInterval] = useState<TimeInterval>(
    getInterval() as TimeInterval
  );
  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo(interval),
    end: new Date(),
  });

  const {
    properties,
    isLoading: isPropertiesLoading,
    refetch,
  } = useGetProperties();

  const [selectedProperties, setSelectedProperties] = useLocalStorage<string[]>(
    "selectedProperties_PropertyPage",
    [],
    () => {
      return () => [];
    }
  );

  return (
    <>
      <AuthHeader
        title={"Properties"}
        subtitle=""
        headerActions={
          <button
            onClick={() => {
              setTimeFilter({
                start: getTimeIntervalAgo(interval),
                end: new Date(),
              });
              refetch();
            }}
            className="font-medium text-black text-sm items-center flex flex-row hover:text-sky-700"
          >
            <ArrowPathIcon
              className={clsx(false ? "animate-spin" : "", "h-5 w-5 inline")}
            />
          </button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
          <ThemedTableHeader
            isFetching={false}
            timeFilter={{
              currentTimeFilter: timeFilter,
              customTimeFilter: true,
              timeFilterOptions: [
                { key: "24h", value: "Today" },
                { key: "7d", value: "7D" },
                { key: "1m", value: "1M" },
                { key: "3m", value: "3M" },
                { key: "all", value: "All" },
              ],
              defaultTimeFilter: interval,
              onTimeSelectHandler: (key: TimeInterval, value: string) => {
                if ((key as string) === "custom") {
                  value = value.replace("custom:", "");
                  const start = new Date(value.split("_")[0]);
                  const end = new Date(value.split("_")[1]);
                  setInterval(key);
                  setTimeFilter({
                    start,
                    end,
                  });
                } else {
                  setInterval(key);
                  setTimeFilter({
                    start: getTimeIntervalAgo(key),
                    end: new Date(),
                  });
                }
              },
            }}
          />
          <div className="w-full space-y-2 max-w-sm">
            <MultiSelect
              placeholder="Select a Custom Property..."
              value={selectedProperties}
              onValueChange={(values: string[]) => {
                setSelectedProperties(values);
              }}
            >
              {properties.map((property, idx) => (
                <MultiSelectItem
                  value={property}
                  key={idx}
                  className="font-medium text-black"
                >
                  {property}
                </MultiSelectItem>
              ))}
            </MultiSelect>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {selectedProperties.length < 1 ? (
            <div className="h-96 p-8 flex flex-col space-y-4 w-full border border-dashed border-gray-300 rounded-xl justify-center items-center text-center">
              <TagIcon className="h-12 w-12 text-gray-700" />
              <p className="text-2xl font-semibold text-gray-700">
                No Properties Selected
              </p>
              <p className="text-gray-500">
                Please select a custom property to view data
              </p>
            </div>
          ) : (
            selectedProperties.map((property, i) => (
              <PropertyCard
                property={property}
                key={i}
                timeFilter={timeFilter}
                onDelete={() => {
                  setSelectedProperties(
                    selectedProperties.filter((p) => p !== property)
                  );
                }}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default PropertiesPage;
