import { useQuery, useMutation } from "@tanstack/react-query";
import { useOrg } from "../../components/layout/org/organizationContext";
import { useJawnClient } from "../../lib/clients/jawnHook";

// A hook for the user's credit balance in cents
export const useCredits = () => {
  const org = useOrg();
  const jawnClient = useJawnClient();
  
  return useQuery({
    queryKey: ["creditBalance", org?.currentOrg?.id],
    queryFn: async () => {
      const orgId = org?.currentOrg?.id;
      if (!orgId) {
        return { balance: 0 };
      }

      const response = await jawnClient.GET("/v1/stripe/cloud/credit-balance");
      if (response.error) {
        throw new Error("Failed to fetch credit balance");
      }
      
      return response.data;
    },
    enabled: !!org?.currentOrg?.id,
  });
};

// A hook for fetching credit balance transactions with pagination
export const useCreditTransactions = (params?: {
  limit?: number;
  starting_after?: string;
}) => {
  const org = useOrg();
  const jawnClient = useJawnClient();
  
  return useQuery({
    queryKey: ["creditTransactions", org?.currentOrg?.id, params?.limit, params?.starting_after],
    queryFn: async () => {
      const orgId = org?.currentOrg?.id;
      if (!orgId) {
        return {
          object: 'list' as const,
          data: [],
          has_more: false,
          url: '/v1/billing/credit_balance_transactions'
        };
      }

      const response = await jawnClient.GET("/v1/stripe/cloud/credit-balance-transactions", {
        params: {
          query: {
            limit: params?.limit ?? 10,
            starting_after: params?.starting_after,
          },
        },
      });
      
      if (response.error) {
        throw new Error("Failed to fetch credit transactions");
      }
      
      return response.data;
    },
    enabled: !!org?.currentOrg?.id,
  });
};

// A hook for creating a Stripe checkout session for adding credits
export const useCreateCheckoutSession = () => {
  const jawnClient = useJawnClient();
  
  return useMutation({
    mutationFn: async (amount: number) => {
      const response = await jawnClient.POST("/v1/stripe/cloud/checkout-session", {
        body: {
          amount,
        },
      });
      
      if (response.error) {
        throw new Error("Failed to create checkout session");
      }
      
      if (response.data) {
        window.location.href = response.data;
      }
    },
    onError: (error) => {
      console.error("Failed to create checkout session:", error);
    },
  });
};