import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { ModelMetric } from "../../../lib/api/models/models";
import { Result } from "../../../lib/result";
import { Database } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedTable from "../../shared/themed/themedTable";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useState } from "react";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { INITIAL_COLUMNS } from "./initialColumns";
import ThemedModal from "../../shared/themed/themedModal";
import {
  ClipboardDocumentIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/outline";
import { Dialog } from "@headlessui/react";
import useNotification from "../../shared/notification/useNotification";
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

  const { data, isLoading } = useQuery({
    queryKey: ["modelMetrics", timeFilter],
    queryFn: async (query) => {
      return await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: "all",
          offset: 0,
          limit: 100,
          timeFilter,
        }),
      }).then((res) => res.json() as Promise<Result<ModelMetric[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <AuthHeader title={"Models"} />
      <ThemedTableV5
        defaultData={data?.data || []}
        defaultColumns={INITIAL_COLUMNS}
        tableKey={"modelMetrics"}
        dataLoading={isLoading}
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
