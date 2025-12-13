import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface MostExpensiveRequest {
  requestId: string;
  cost: number;
  model: string;
  provider: string;
  createdAt: string;
  promptTokens: number;
  completionTokens: number;
  conversation: {
    messages: ConversationMessage[];
    turnCount: number;
    totalWords: number;
  } | null;
}

export interface WrappedStats {
  totalRequests: number;
  topProviders: Array<{ provider: string; count: number }>;
  topModels: Array<{ model: string; count: number }>;
  totalTokens: {
    prompt: number;
    completion: number;
    cacheWrite: number;
    cacheRead: number;
    total: number;
  };
  mostExpensiveRequest: MostExpensiveRequest | null;
}

export const useWrapped = () => {
  const jawn = useJawnClient();

  return useQuery({
    queryKey: ["wrapped-2025"],
    queryFn: async () => {
      const response = await jawn.GET("/v1/wrapped/2025");
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      return response.data?.data as WrappedStats;
    },
    staleTime: 1000 * 60 * 60, // 1 hour client-side caching
    refetchOnWindowFocus: false,
  });
};

export const useHasWrappedData = () => {
  const jawn = useJawnClient();

  const query = useQuery({
    queryKey: ["wrapped-2025-check"],
    queryFn: async () => {
      const response = await jawn.GET("/v1/wrapped/2025/check");
      if (response.data?.error) {
        return false;
      }
      return response.data?.data?.hasData ?? false;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  return {
    hasData: query.data ?? false,
    isLoading: query.isLoading,
  };
};
