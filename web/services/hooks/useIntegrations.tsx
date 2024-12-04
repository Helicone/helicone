import { useOrg } from "@/components/layout/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { getJawnClient } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/public";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Integration = {
  integration_name?: string;
  settings?: components["schemas"]["Json"];
  active?: boolean;
  id: string;
};

type IntegrationNames = "open_pipe" | "segment";

export function useIntegration(integrationName: IntegrationNames) {
  const org = useOrg();
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();

  const { data: integration, isLoading: isLoadingIntegration } = useQuery({
    queryKey: ["integrations", org?.currentOrg?.id, integrationName],
    queryFn: async (query) => {
      const orgId = query.queryKey[1];
      const integrationName = query.queryKey[2];
      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.GET("/v1/integration");
      if (response.data?.error) throw new Error(response.data.error);
      return response.data?.data?.find(
        (int) => int.integration_name === integrationName
      );
    },
  });

  const { mutate: updateIntegration, isLoading: isUpdatingIntegration } =
    useMutation({
      mutationFn: async (params: {
        autoDatasetSync: boolean;
        active: boolean;
      }) => {
        const jawnClient = getJawnClient();
        if (integration?.id) {
          return jawnClient.POST(`/v1/integration/{integrationId}`, {
            params: { path: { integrationId: integration.id } },
            body: {
              settings: {
                ...integration.settings,
                autoDatasetSync: params.autoDatasetSync,
              },
              active: params.active,
            },
          });
        } else {
          return jawnClient.POST("/v1/integration", {
            body: {
              integration_name: integrationName,
              settings: { autoDatasetSync: params.autoDatasetSync },
              active: params.active,
            },
          });
        }
      },
      onSuccess: () => {
        setNotification(
          "OpenPipe integration settings updated successfully",
          "success"
        );
        queryClient.invalidateQueries({
          queryKey: ["integrations", org?.currentOrg?.id, integrationName],
        });
      },
      onError: (error) => {
        setNotification(
          `Failed to update OpenPipe integration settings: ${error}`,
          "error"
        );
      },
    });

  return {
    integration,
    isLoadingIntegration,
    updateIntegration,
    isUpdatingIntegration,
  };
}

export const useIntegrations = () => {
  const org = useOrg();
  const {
    data: integrations,
    isLoading: isLoadingIntegrations,
    refetch: refetchIntegrations,
  } = useQuery({
    queryKey: ["integrations", org?.currentOrg?.id],
    queryFn: async () => {
      const jawnClient = getJawnClient();
      const response = await jawnClient.GET("/v1/integration");
      return response.data?.data;
    },
  });
  return { integrations, isLoadingIntegrations, refetchIntegrations };
};
