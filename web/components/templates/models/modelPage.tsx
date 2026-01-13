import { useState } from "react";
import { ModelMetric } from "../../../services/hooks/models";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import AuthHeader from "../../shared/authHeader";
import ThemedTable from "../../shared/themed/table/themedTableOld";
import { INITIAL_COLUMNS } from "./initialColumns";
import { $JAWN_API } from "@/lib/clients/jawn";

import useSearchParams from "../../shared/utils/useSearchParams";

interface ModelPageProps {}

const ModelPage = (props: ModelPageProps) => {
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

  const { data, isLoading } = $JAWN_API.useQuery(
    "post",
    "/v1/metrics/models",
    {
      body: {
        filter: {},
        offset: 0,
        limit: 100,
        timeFilter: {
          start: timeFilter.start.toISOString(),
          end: timeFilter.end.toISOString(),
        },
      },
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  return (
    <>
      <AuthHeader title={"Models"} />
      <ThemedTable
        id="modelMetrics"
        defaultData={data?.data || []}
        defaultColumns={INITIAL_COLUMNS}
        skeletonLoading={isLoading}
        dataLoading={false}
        exportData={data?.data || []}
        onRowSelect={(row) => {}}
        timeFilter={{
          currentTimeFilter: timeFilter,
          defaultValue: "all",
          onTimeSelectHandler: (key: TimeInterval, value: string) => {
            if ((key as string) === "custom") {
              const [startDate, endDate] = value.split("_");

              const start = new Date(startDate);
              const end = new Date(endDate);
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
    </>
  );
};

export default ModelPage;
