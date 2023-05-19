import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Property } from "../../lib/api/properties/properties";
import { ok, Result } from "../../lib/result";
import {
  getPropertyFilters,
  SingleFilterDef,
} from "../lib/filters/frontendFilterDefs";
import { getProperties } from "../lib/properties";
import { getPropertyParams } from "../lib/propertyParams";
import { useDebounce } from "./debounce";
import { getFeedback } from "../lib/feedback";

interface Feedback {
    name: string;
    dataType: string;
}

const useGetFeedback = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["feedback"],
    queryFn: async () => {
      return getFeedback().then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  const allFeedback: Feedback[] = data ?? [];

  return {
    feedback: allFeedback || [],
    isLoading,
    error,
  };
};

export { useGetFeedback };
