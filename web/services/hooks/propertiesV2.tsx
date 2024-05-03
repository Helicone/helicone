import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Property } from "../../lib/api/properties/properties";
import { ok, Result } from "../../lib/result";
import {
  getPropertyFiltersV2,
  SingleFilterDef,
} from "../lib/filters/frontendFilterDefs";
import { getPropertiesV2 } from "../lib/propertiesV2";
import { getPropertyParamsV2 } from "../lib/propertyParamsV2";
import { useDebounce } from "./debounce";

const useGetPropertiesV2 = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["propertiesV2"],
    queryFn: async () => {
      return getPropertiesV2().then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  const allProperties: string[] =
    data?.data
      ?.map((property: Property) => {
        return property.property;
      })
      ?.filter(
        (property: string) =>
          "helicone-sent-to-posthog" !== property.toLowerCase()
      )
      // sort by property alphabetically
      .sort() ?? [];

  const [propertyFilters, setPropertyFilters] = useState<
    SingleFilterDef<"request_response_versioned">[]
  >(getPropertyFiltersV2(allProperties, []));

  const [propertySearch, setPropertySearch] = useState({
    property: "",
    search: "",
  });
  const debouncedPropertySearch = useDebounce(propertySearch, 300);

  useEffect(() => {
    setPropertyFilters(getPropertyFiltersV2(allProperties, []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    const { property, search } = debouncedPropertySearch;
    async function doSearch() {
      const values = await getPropertyParamsV2(property, search);
      if (values.error !== null) {
        console.error(values.error);
        return;
      }
      const propertyFilters = getPropertyFiltersV2(
        allProperties,
        values.data?.map((v: any) => ({
          param: v.property_param,
          key: v.property_key,
        }))
      );

      setPropertyFilters(propertyFilters);
    }

    if (property !== "") {
      doSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPropertySearch]);

  async function searchPropertyFilters(
    property: string,
    search: string
  ): Promise<Result<void, string>> {
    setPropertySearch({ property, search });
    return ok(undefined);
  }

  return {
    properties: allProperties || [],
    isLoading,
    error,
    propertyFilters,
    searchPropertyFilters,
    refetch,
  };
};

export { useGetPropertiesV2 };
