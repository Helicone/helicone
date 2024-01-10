import { useQuery } from "@tanstack/react-query";
import { Result } from "../../../lib/result";
import { DecryptedProviderKeyMapping } from "../../../services/lib/keys";
import { LimitUsageResult } from "../../../pages/api/proxy_keys/usage/get";

const useLimitsCell = (limits?: DecryptedProviderKeyMapping["limits"]) => {
  const {
    data: proxyKeysUsage,
    isLoading: isProxyKeysLoading,
    refetch: refetchProxyKeys,
  } = useQuery({
    queryKey: ["proxy-keys/usage", limits],
    queryFn: async () => {
      if (!limits) {
        return {
          data: [],
          error: null,
        };
      }
      const resp = fetch("/api/proxy_keys/usage/get", {
        method: "POST",
        body: JSON.stringify({ limits }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(
        (res) => res.json() as Promise<Result<LimitUsageResult[], string>>
      );
      return resp;
    },
    refetchOnWindowFocus: false,
  });

  return {
    proxyKeysUsage: proxyKeysUsage?.data ?? [],
    isLoading: isProxyKeysLoading,
    refetchProxyKeys,
  };
};

export { useLimitsCell };
