import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrg } from "../../components/layout/organizationContext";
import { Property } from "../../lib/api/properties/properties";
import { getJawnClient } from "../../lib/clients/jawn";
import { ok, Result } from "../../lib/result";
import { InputParam, SingleFilterDef } from "../lib/filters/frontendFilterDefs";
import { getPropertyParamsV2 } from "../lib/propertyParamsV2";
import { useDebounce } from "./debounce";

function useGetPropertiesV2<T extends "properties" | "request_response_rmt">(
  getPropertyFilters: (
    properties: string[],
    inputParams: InputParam[]
  ) => SingleFilterDef<T>[]
) {
  const orgId = useOrg();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["propertiesV2", orgId?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      const res = await jawn.POST("/v1/property/query", {
        body: {},
      });
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  const allProperties = useMemo((): string[] => {
    return (
      propertiesQuery.data?.data
        ?.map((property: Property) => property.property)
        ?.filter(
          (property: string) =>
            "helicone-sent-to-posthog" !== property.toLowerCase()
        )
        .sort() ?? []
    );
  }, [propertiesQuery.data]);

  const propertyFiltersQuery = useQuery({
    queryKey: ["propertiesV2Search", debouncedPropertySearch],
    queryFn: async ({ queryKey }) => {
      const [, { property, search }] = queryKey as [
        string,
        typeof debouncedPropertySearch
      ];
      if (property === "") {
        return getPropertyFilters(allProperties, []);
      }
      const values = await getPropertyParamsV2(property, search);
      if (values.error !== null) {
        console.error(values.error);
        return getPropertyFilters(allProperties, []);
      }
      return getPropertyFilters(
        allProperties,
        values.data?.map((v: any) => ({
          param: v.property_param,
          key: v.property_key,
        })) || []
      );
    },
    enabled:
      debouncedPropertySearch.property !== "" && !propertiesQuery.isLoading,
    keepPreviousData: true,
  });

  const propertyFilters = useMemo(() => {
    return propertyFiltersQuery.data || getPropertyFilters(allProperties, []);
  }, [propertyFiltersQuery.data, allProperties, getPropertyFilters]);

  const searchPropertyFilters = useCallback(
    async (property: string, search: string): Promise<Result<void, string>> => {
      setPropertySearch({ property, search });
      return ok(undefined);
    },
    []
  );

  return {
    properties: allProperties,
    isLoading: propertiesQuery.isLoading,
    error: propertiesQuery.error,
    propertyFilters,
    searchPropertyFilters,
    refetch: propertiesQuery.refetch,
  };
}

export { useGetPropertiesV2 };
