import useNotification from "@/components/shared/notification/useNotification";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery, useMutation } from "@tanstack/react-query";

const OPEN_PIPE_PROVIDER_NAME = "OPEN_PIPE";

export function useOpenPipeKey() {
  const jawnClient = useJawnClient();
  const { setNotification } = useNotification();

  const { data: existingKey, isLoading: isLoadingVault } = useQuery({
    queryKey: ["openPipeKey"],
    queryFn: async () => {
      const response = await jawnClient.GET("/v1/vault/keys");
      if (response.data?.error) throw new Error(response.data.error);
      return response.data?.data?.find(
        (key) => key.provider_name === OPEN_PIPE_PROVIDER_NAME
      );
    },
  });

  const { mutate: saveKey, isLoading: isSavingKey } = useMutation({
    mutationFn: async (newKey: string) => {
      if (existingKey?.id) {
        return jawnClient.PATCH(`/v1/vault/update/{id}`, {
          params: { path: { id: existingKey.id } },
          body: { key: newKey, name: "OpenPipe API Key" },
        });
      } else {
        return jawnClient.POST("/v1/vault/add", {
          body: {
            key: newKey,
            provider: OPEN_PIPE_PROVIDER_NAME,
            name: "OpenPipe API Key",
          },
        });
      }
    },
    onSuccess: () => {
      setNotification("OpenPipe API key saved successfully", "success");
    },
    onError: (error) => {
      setNotification(`Failed to save OpenPipe API key: ${error}`, "error");
    },
  });

  return {
    existingKey,
    isLoadingVault,
    saveKey,
    isSavingKey,
  };
}
