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

const useGetProperties = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      return getProperties().then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  const allProperties: string[] =
    data?.data?.map((property: Property) => {
      return property.property;
    }) ?? [];

  const [propertyFilters, setPropertyFilters] = useState<
    SingleFilterDef<"properties">[]
  >(getPropertyFilters(allProperties, []));

  const [propertySearch, setPropertySearch] = useState({
    property: "",
    search: "",
  });
  const debouncedPropertySearch = useDebounce(propertySearch, 300);

  useEffect(() => {
    setPropertyFilters(getPropertyFilters(allProperties, []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    const { property, search } = debouncedPropertySearch;
    async function doSearch() {
      const values = await getPropertyParams(property, search);
      if (values.error !== null) {
        console.error(values.error);
        return;
      }
      const propertyFilters = getPropertyFilters(
        allProperties,
        values.data?.map((v) => ({
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

export { useGetProperties };
