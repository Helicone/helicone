import { useState } from "react";

import {
  getTimeInterval,
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";

import AuthHeader from "../../shared/authHeader";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { ThemedMultiSelect } from "../../shared/themed/themedMultiSelect";
import { ThemedPill } from "../../shared/themed/themedPill";
import { useGetProperties } from "../../../services/hooks/properties";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import PropertyCard from "./propertyCard";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";

const PropertiesPage = (props: {}) => {
  const [interval, setInterval] = useState<TimeInterval>("all");
  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo(interval),
    end: new Date(),
  });

  const { properties, isLoading: isPropertiesLoading } = useGetProperties();
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
        subtitle="< 06/05 still migrating"
        headerActions={
          <button
            onClick={() => {
              setTimeFilter({
                start: getTimeIntervalAgo(interval),
                end: new Date(),
              });
            }}
            className="font-medium text-black text-sm items-center flex flex-row hover:text-sky-700"
          >
            <ArrowPathIcon
              className={clsx(false ? "animate-spin" : "", "h-5 w-5 inline")}
            />
          </button>
        }
      />

      <div className="flex flex-col gap-5">
        <ThemedTableHeader
          isFetching={false}
          timeFilter={{
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
        <div className="flex flex-row gap-2 items-center">
          <ThemedMultiSelect
            columns={properties.map((property) => ({
              label: property,
              value: property,
              active: selectedProperties.includes(property),
            }))}
            buttonLabel={isPropertiesLoading ? "Loading..." : "Properties"}
            onSelect={(value) => {
              if (selectedProperties.includes(value)) {
                setSelectedProperties(
                  selectedProperties.filter((p) => p !== value)
                );
              } else {
                setSelectedProperties([...selectedProperties, value]);
              }
            }}
            deselectAll={() => {
              setSelectedProperties([]);
            }}
            selectAll={() => {
              setSelectedProperties(properties);
            }}
          />
          {selectedProperties.map((property, i) => (
            <div key={i}>
              <ThemedPill
                label={property}
                onDelete={() => {
                  setSelectedProperties(
                    selectedProperties.filter((p) => p !== property)
                  );
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5">
          {selectedProperties.map((property, i) => (
            <PropertyCard property={property} key={i} timeFilter={timeFilter} />
          ))}
        </div>
      </div>
    </>
  );
};

export default PropertiesPage;
