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
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  const allProperties = useMemo(
    () =>
      data?.data
        ?.map((property: Property) => property.property)
        ?.filter(
          (property: string) =>
            "helicone-sent-to-posthog" !== property.toLowerCase()
        )
        .sort() ?? [],
    [data]
  );

  const memoizedGetPropertyFilters = useCallback(
    (properties: string[], inputParams: InputParam[]) =>
      getPropertyFilters(properties, inputParams),
    [getPropertyFilters]
  );

  const [propertyFilters, setPropertyFilters] = useState<SingleFilterDef<T>[]>(
    memoizedGetPropertyFilters(allProperties, [])
  );

  const [propertySearch, setPropertySearch] = useState({
    property: "",
    search: "",
  });
  const debouncedPropertySearch = useDebounce(propertySearch, 300);

  useEffect(() => {
    setPropertyFilters(memoizedGetPropertyFilters(allProperties, []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const { data: propertyFiltersData, isLoading: propertyFiltersLoading } =
    useQuery({
      queryKey: ["propertiesV2Search", debouncedPropertySearch],
      queryFn: async ({ queryKey }) => {
        const [, { property, search }] = queryKey as [
          string,
          typeof debouncedPropertySearch
        ];
        if (property === "") {
          return memoizedGetPropertyFilters(allProperties, []);
        }
        const values = await getPropertyParamsV2(property, search);
        if (values.error !== null) {
          console.error(values.error);
          return memoizedGetPropertyFilters(allProperties, []);
        }
        return memoizedGetPropertyFilters(
          allProperties,
          values.data?.map((v: any) => ({
            param: v.property_param,
            key: v.property_key,
          })) || []
        );
      },
      enabled: debouncedPropertySearch.property !== "",
      keepPreviousData: true,
    });

  useEffect(() => {
    if (propertyFiltersData || allProperties.length > 0) {
      setPropertyFilters(
        propertyFiltersData || memoizedGetPropertyFilters(allProperties, [])
      );
    }
  }, [propertyFiltersData, allProperties, memoizedGetPropertyFilters]);

  async function searchPropertyFilters(
    property: string,
    search: string
  ): Promise<Result<void, string>> {
    setPropertySearch({ property, search });
    return ok(undefined);
  }
  return {
    properties: (allProperties || []) as string[],
    isLoading,
    error,
    propertyFilters,
    searchPropertyFilters,
    refetch,
  };
}

export { useGetPropertiesV2 };
