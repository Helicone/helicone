import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { getJawnClient } from "@/lib/clients/jawn";
import { generateAPIKeyHelper } from "@/utils/generateAPIKeyHelper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useLocation } from "react-router";

export const useKeys = () => {
  const org = useOrg();
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();

  const pathname = useLocation().pathname;

  const useGovernance =
    pathname.includes("access-keys") && !!org?.currentOrg?.governance_settings;

  const keys = useQuery({
    queryKey: ["keys", org?.currentOrg?.id],
    enabled: !!pathname,
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET("/v1/api-keys", {
        params: {
          query: {
            governance: useGovernance ? "true" : "false",
          },
        },
      });
    },
  });
  const addKey = useMutation({
    mutationFn: async ({
      permission,
      keyName,
      isEu,
      enableRateLimit,
    }: {
      permission: "rw" | "w";
      keyName: string;
      isEu: boolean;
      enableRateLimit?: boolean;
    }) => {
      const { res, apiKey } = generateAPIKeyHelper(
        permission,
        org?.currentOrg?.organization_type!,
        keyName,
        isEu,
        useGovernance,
        enableRateLimit
      );
      return { res: await res, apiKey };
    },
    onSuccess: () => {
      setNotification("Successfully created API key", "success");
      queryClient.invalidateQueries({
        queryKey: ["keys", org?.currentOrg?.id],
      });
      keys.refetch();
    },
    onError: () => {
      setNotification("Failed to create API key", "error");
    },
  });

  const deleteKey = useMutation({
    mutationFn: (apiKeyId: string) => {
      return $JAWN_API.DELETE("/v1/api-keys/{apiKeyId}", {
        params: {
          path: {
            apiKeyId: Number(apiKeyId),
          },
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["keys", org?.currentOrg?.id],
      });
      keys.refetch();
    },
  });

  const editKey = useMutation({
    mutationFn: ({
      apiKeyId,
      apiKeyName,
    }: {
      apiKeyId: string;
      apiKeyName: string;
    }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.PATCH("/v1/api-keys/{apiKeyId}", {
        params: {
          path: { apiKeyId: Number(apiKeyId) },
        },
        body: {
          api_key_name: apiKeyName,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["keys", org?.currentOrg?.id],
      });
      keys.refetch();
    },
  });

  return {
    addKey,
    keys,
    deleteKey,
    editKey,
  };
};

type NonNullableKey = NonNullable<
  Awaited<ReturnType<typeof useKeys>["keys"]["data"]>
>;

export type KeyData = NonNullable<NonNullableKey>["data"];
