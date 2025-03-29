import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FilterUIDefinition } from "./types";
import {
  STATIC_FILTER_DEFINITIONS,
  STATIC_USER_VIEW_DEFINITIONS,
  STATIC_SESSIONS_VIEW_DEFINITIONS,
} from "./staticDefinitions";

import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { useRouter } from "next/router";

const KNOWN_HELICONE_PROPERTIES = {
  "helicone-session-id": {
    label: "Session ID",
    subType: "sessions",
  },
  "helicone-session-name": {
    label: "Session Name",
    subType: "sessions",
  },
  "helicone-session-path": {
    label: "Session Path",
    subType: "sessions",
  },
} as const;
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

  const models = useQuery({
    queryKey: ["/v1/models", org?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      const res = await jawn.GET("/v1/models");
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

  const router = useRouter();
  // Combine static definitions with dynamic ones
  const completeDefinitions = useMemo(() => {
    const dynamicDefinitions: FilterUIDefinition[] =
      properties.data?.data?.map((property) => ({
        id: property.property,
        label:
          property.property.toLowerCase() in KNOWN_HELICONE_PROPERTIES
            ? KNOWN_HELICONE_PROPERTIES[
                property.property.toLowerCase() as keyof typeof KNOWN_HELICONE_PROPERTIES
              ].label
            : property.property,
        type: "searchable",
        operators: ["contains", "eq", "neq", "like", "ilike", "in"],
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
        table: "request_response_rmt",
      })) ?? [];

    const modelsDefinition: FilterUIDefinition = {
      id: "model",
      label: "Model",
      type: "searchable",
      operators: ["contains", "eq", "neq", "like", "ilike", "in"],

      onSearch: async (searchTerm) => {
        return Promise.resolve(
          models.data?.data
            ?.filter(
              (m) =>
                m.model.toLowerCase().includes(searchTerm.toLowerCase()) &&
                m.model !== ""
            )
            .map((m) => ({
              label: m.model,
              value: m.model,
            })) ?? []
        );
      },
      table: "request_response_rmt",
    };

    // Replace or add dynamic definitions to the static ones
    const staticIdsToExclude = dynamicDefinitions.map((def) => def.id);
    const filteredStaticDefs = STATIC_FILTER_DEFINITIONS.filter(
      (def) => !staticIdsToExclude.includes(def.id)
    );

    const definitions = [
      modelsDefinition,
      ...filteredStaticDefs,
      ...dynamicDefinitions,
    ] as FilterUIDefinition[];

    if (router.pathname.startsWith("/users")) {
      definitions.push(...STATIC_USER_VIEW_DEFINITIONS);
    }
    if (router.pathname.startsWith("/sessions")) {
      definitions.push(...STATIC_SESSIONS_VIEW_DEFINITIONS);

      for (const def of definitions) {
        if (
          def.subType === "property" &&
          def.id.toLowerCase() in KNOWN_HELICONE_PROPERTIES
        ) {
          def.subType =
            KNOWN_HELICONE_PROPERTIES[
              def.id.toLowerCase() as keyof typeof KNOWN_HELICONE_PROPERTIES
            ].subType;
        }
      }
    }

    return definitions;
  }, [
    properties.data?.data,
    router.pathname,
    searchProperties,
    models.data?.data,
  ]); // Include all dependencies

  return {
    filterDefinitions: completeDefinitions,
    isLoading: properties.isLoading || models.isLoading,
    error: properties.error || models.error,
  };
};
