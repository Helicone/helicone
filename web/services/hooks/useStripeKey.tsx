import useNotification from "@/components/shared/notification/useNotification";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useQueryClient } from "@tanstack/react-query";

const STRIPE_PROVIDER_NAME = "HELICONE_STRIPE_KEY";

export function useStripeKey() {
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();

  const { data: vaultKeys, isPending: isLoadingVault } = $JAWN_API.useQuery(
    "get",
    "/v1/vault/keys",
    {},
    {
      refetchOnWindowFocus: false,
    }
  );

  const existingKey = vaultKeys?.data?.find(
    (key) => key.provider_name === STRIPE_PROVIDER_NAME
  );

  const saveKeyMutation = $JAWN_API.useMutation(
    "post",
    "/v1/vault/add",
    {
      onSuccess: () => {
        setNotification("Stripe API key saved successfully", "success");
        queryClient.invalidateQueries({
          queryKey: ["get", "/v1/vault/keys", {}],
        });
      },
      onError: (error) => {
        setNotification(`Failed to save Stripe API key: ${error}`, "error");
      },
    }
  );

  const updateKeyMutation = $JAWN_API.useMutation(
    "patch",
    "/v1/vault/update/{id}",
    {
      onSuccess: () => {
        setNotification("Stripe API key updated successfully", "success");
        queryClient.invalidateQueries({
          queryKey: ["get", "/v1/vault/keys", {}],
        });
      },
      onError: (error) => {
        setNotification(`Failed to update Stripe API key: ${error}`, "error");
      },
    }
  );

  const saveKey = async (newKey: string) => {
    if (existingKey?.id) {
      return updateKeyMutation.mutateAsync({
        params: { path: { id: existingKey.id } },
        body: { key: newKey, name: "Stripe Restricted Access Key" },
      });
    } else {
      return saveKeyMutation.mutateAsync({
        body: {
          key: newKey,
          provider: STRIPE_PROVIDER_NAME,
          name: "Stripe Restricted Access Key",
        },
      });
    }
  };

  return {
    existingKey,
    isLoadingVault,
    saveKey,
    isSavingKey: saveKeyMutation.isPending || updateKeyMutation.isPending,
  };
}