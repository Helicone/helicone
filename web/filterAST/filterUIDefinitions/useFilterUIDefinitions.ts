import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FilterUIDefinition } from "./types";
import { STATIC_FILTER_DEFINITIONS } from "./staticDefinitions";

import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";

/**
 * Hook to fetch and combine static and dynamic filter UI definitions
 *
 * @returns {Object} Object containing filter definitions, loading state, and error
 */
export const useFilterUIDefinitions = () => {
  const org = useOrg();
  const properties = useQuery({
    queryKey: ["/v1/property/query", org?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      const res = await jawn.POST("/v1/property/query", {
        body: {},
      });
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  const searchProperties = useMutation({
    mutationFn: async (params: { propertyKey: string; searchTerm: string }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const res = await jawn.POST("/v1/property/{propertyKey}/search", {
        body: {
          searchTerm: params.searchTerm,
        },
        params: {
          path: {
            propertyKey: params.propertyKey,
          },
        },
      });
      return res.data;
    },
  });

  // Combine static definitions with dynamic ones
  const completeDefinitions = useMemo(() => {
    const dynamicDefinitions: FilterUIDefinition[] =
      properties.data?.data?.map((property) => ({
        id: property.property,
        label: property.property,
        type: "string",
        operators: ["eq", "neq", "like", "ilike", "contains", "in"],
        onSearch: (searchTerm) => {
          return searchProperties
            .mutateAsync({
              propertyKey: property.property,
              searchTerm,
            })
            .then(
              (res) =>
                res?.data?.map((r) => ({
                  label: r,
                  value: r,
                })) ?? []
            );
        },
        subType: "property",
      })) ?? [];

    // Replace or add dynamic definitions to the static ones
    const staticIdsToExclude = dynamicDefinitions.map((def) => def.id);
    const filteredStaticDefs = STATIC_FILTER_DEFINITIONS.filter(
      (def) => !staticIdsToExclude.includes(def.id)
    );

    return [...filteredStaticDefs, ...dynamicDefinitions];
  }, [properties.data?.data, searchProperties]); // Include all dependencies

  return {
    filterDefinitions: completeDefinitions,
    isLoading: properties.isLoading,
    error: properties.error,
  };
};
