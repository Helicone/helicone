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
      filter: "all",
      isCached: false,
      limit: 10,
      offset: 0,
      sort: { created_at: "desc" },
      isScored: false,
      isPartOfExperiment: false,
    }),
  };

  const response = await fetch(
    "https://api.helicone.ai/v1/request/query",
    options
  );
  const data = await response.json();

  return data;
};

export const useTestAPIKey = (apiKey: string) => {
  return useQuery({
    queryKey: ["test-api-key"],
    queryFn: () => testAPIKey(apiKey),
  });
};
