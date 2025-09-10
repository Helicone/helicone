import { useQuery } from "@tanstack/react-query";
import { useHeliconeLogin } from "../useHeliconeLogin";

export const testAPIKey = async (apiKey: string) => {
  if (!apiKey) {
    return null;
  }
  const options = {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {},
      isCached: false,
      limit: 10,
      offset: 0,
      sort: { created_at: "desc" },
      isScored: false,
      isPartOfExperiment: false,
    }),
  };

  const getApiUrl = () => {
    const jawnService = process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE;
    if (jawnService) {
      return `${jawnService}/v1/request/query`;
    }
    // Fallback to production API
    return "https://api.helicone.ai/v1/request/query";
  };

  const response = await fetch(getApiUrl(), options);
  const data = await response.json();

  return data;
};

export const useTestAPIKey = (apiKey: string) => {
  return useQuery({
    queryKey: ["test-api-key", apiKey],
    queryFn: () => testAPIKey(apiKey),
  });
};
