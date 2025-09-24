import useNotification from "@/components/shared/notification/useNotification";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

const STRIPE_PROVIDER_NAME = "HELICONE_STRIPE_KEY";

export function useStripeKey() {
  const queryClient = useQueryClient();
  const jawnClient = useJawnClient();
  const { setNotification } = useNotification();

  const { data: existingKey, isPending: isLoadingVault } = useQuery({
    queryKey: ["stripeKey"],
    queryFn: async () => {
      const response = await jawnClient.GET("/v1/vault/keys");
      if (response.data?.error) throw new Error(response.data.error);
      return response.data?.data?.find(
        (key) => key.provider_name === STRIPE_PROVIDER_NAME,
      );
    },
  });

  const { mutate: saveKey, isPending: isSavingKey } = useMutation({
    mutationFn: async (newKey: string) => {
      if (existingKey?.id) {
        return jawnClient.PATCH(`/v1/vault/update/{id}`, {
          params: { path: { id: existingKey.id } },
          body: { key: newKey, name: "Stripe Restricted Access Key" },
        });
      } else {
        return jawnClient.POST("/v1/vault/add", {
          body: {
            key: newKey,
            provider: STRIPE_PROVIDER_NAME,
            name: "Stripe Restricted Access Key",
          },
        });
      }
    },
    onSuccess: () => {
      setNotification("Stripe API key saved successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["stripeKey"] });
    },
    onError: (error) => {
      setNotification(`Failed to save Stripe API key: ${error}`, "error");
    },
  });

  return {
    existingKey,
    isLoadingVault,
    saveKey,
    isSavingKey,
  };
}