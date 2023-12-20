import { useQuery } from "@tanstack/react-query";
import FilterBadge from "../../../ui/filters/filterBadge";
import { getTimeIntervalAgo } from "../../../../lib/timeCalculations/time";
import { Result } from "../../../../lib/result";
import { ModelMetric } from "../../../../lib/api/models/models";
import { useRouter } from "next/router";
import { useState } from "react";
import ListFilterBadge from "./shared/listFilterBadge";

interface ModelFilterBadgeProps {}

const ModelFilterBadge = (props: ModelFilterBadgeProps) => {
  const {} = props;

  const { data, isLoading } = useQuery({
    queryKey: ["modelMetrics"],
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
          timeFilter: {
            start: getTimeIntervalAgo("all"),
            end: new Date(),
          },
        }),
      }).then((res) => res.json() as Promise<Result<ModelMetric[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  return (
    <ListFilterBadge
      listKey="model"
      options={
        data?.data?.map((model) => ({
          label: model.model,
          value: model.model,
        })) || []
      }
    />
  );
};

export default ModelFilterBadge;
