import useNotification from "@/components/shared/notification/useNotification";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

const SEGMENT_PROVIDER_NAME = "HELICONE_SEGMENT_KEY";

export function useSegmentKey() {
  const queryClient = useQueryClient();
  const jawnClient = useJawnClient();
  const { setNotification } = useNotification();

  const { data: existingKey, isLoading: isLoadingVault } = useQuery({
    queryKey: ["segmentKey"],
    queryFn: async () => {
      const response = await jawnClient.GET("/v1/vault/keys");
      if (response.data?.error) throw new Error(response.data.error);
      return response.data?.data?.find(
        (key) => key.provider_name === SEGMENT_PROVIDER_NAME
      );
    },
  });

  const { mutate: saveKey, isLoading: isSavingKey } = useMutation({
    mutationFn: async (newKey: string) => {
      if (existingKey?.id) {
        return jawnClient.PATCH(`/v1/vault/update/{id}`, {
          params: { path: { id: existingKey.id } },
          body: { key: newKey, name: "Segment API Key" },
        });
      } else {
        return jawnClient.POST("/v1/vault/add", {
          body: {
            key: newKey,
            provider: SEGMENT_PROVIDER_NAME,
            name: "Segment API Key",
          },
        });
      }
    },
    onSuccess: () => {
      setNotification("Segment API key saved successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["segmentKey"] });
    },
    onError: (error) => {
      setNotification(`Failed to save Segment API key: ${error}`, "error");
    },
  });

  return {
    existingKey,
    isLoadingVault,
    saveKey,
    isSavingKey,
  };
}
