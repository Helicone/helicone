import { useQuery, useMutation } from "@tanstack/react-query";
import { useOrg } from "../../components/layout/org/organizationContext";
import { useJawnClient } from "../../lib/clients/jawnHook";
import { err, isError, ok } from "../../../packages/common/result";

// Types matching the backend
export interface PurchasedCredits {
  id: string;
  createdAt: number;
  credits: number;
  referenceId: string;
}

export interface PaginatedPurchasedCredits {
  purchases: PurchasedCredits[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreditBalanceResponse {
  totalCreditsPurchased: number;
  balance: number;
}

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

      const response = await jawnClient.GET("/v1/credits/balance");
      if (response.error) {
        throw new Error("Failed to fetch credit balance");
      }
      
      return response.data?.data as CreditBalanceResponse;
    },
    enabled: !!org?.currentOrg?.id,
  });
};

// A hook for fetching credit balance transactions with pagination
export const useCreditTransactions = (params?: {
  page?: number;
  pageSize?: number;
}) => {
  const org = useOrg();
  const jawnClient = useJawnClient();
  
  return useQuery({
    queryKey: ["creditTransactions", org?.currentOrg?.id, params?.page, params?.pageSize],
    queryFn: async () => {
      const orgId = org?.currentOrg?.id;
      if (!orgId) {
        return {
          purchases: [],
          total: 0,
          page: 0,
          pageSize: 10
        };
      }

      const response = await jawnClient.GET("/v1/credits/payments", {
        params: {
          query: {
            page: params?.page ?? 0,
            pageSize: params?.pageSize ?? 10,
          },
        },
      });
      
      if (!response.data || isError(response.data)) {
        throw new Error(response.data?.error || "Failed to fetch credit transactions");
      }
      
      return response.data?.data as PaginatedPurchasedCredits;
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
        window.location.href = response.data.checkoutUrl;
      }
    },
    onError: (error) => {
      console.error("Failed to create checkout session:", error);
    },
  });
};