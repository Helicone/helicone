import { useQuery } from "@tanstack/react-query";
import { Result } from "../../../lib/result";
import {
  DecryptedProviderKey,
  DecryptedProviderKeyMapping,
} from "../../../services/lib/keys";

const useVaultPage = () => {
  const {
    data: providerKeys,
    isLoading: isProviderKeyLoading,
    refetch: refetchProviderKeys,
  } = useQuery({
    queryKey: ["provider-keys"],
    queryFn: async () => {
      const resp = fetch("/api/provider_keys/get").then(
        (res) => res.json() as Promise<Result<DecryptedProviderKey[], string>>
      );
      return resp;
    },
    refetchOnWindowFocus: false,
  });

  const {
    data: proxyKeys,
    isLoading: isProxyKeysLoading,
    refetch: refetchProxyKeys,
  } = useQuery({
    queryKey: ["proxy-keys"],
    queryFn: async () => {
      const resp = fetch("/api/proxy_keys/get").then(
        (res) =>
          res.json() as Promise<Result<DecryptedProviderKeyMapping[], string>>
      );
      return resp;
    },
    refetchOnWindowFocus: false,
  });

  return {
    providerKeys: providerKeys?.data ?? [],
    proxyKeys: proxyKeys?.data ?? [],
    isLoading: isProviderKeyLoading || isProxyKeysLoading,
    refetchProxyKeys,
    refetchProviderKeys,
  };
};

export { useVaultPage };
