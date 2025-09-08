import { useOrg } from "../../components/layout/org/organizationContext";
import { $JAWN_API } from "../../lib/clients/jawn";

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
  
  const result = $JAWN_API.useQuery(
    "get",
    "/v1/credits/balance",
    {},
    {
      enabled: !!org?.currentOrg?.id,
    }
  );

  return {
    ...result,
    data: result.data?.data || { balance: 0 },
  };
};

// A hook for fetching credit balance transactions with pagination
export const useCreditTransactions = (params?: {
  page?: number;
  pageSize?: number;
}) => {
  const org = useOrg();
  
  const result = $JAWN_API.useQuery(
    "get",
    "/v1/credits/payments",
    {
      params: {
        query: {
          page: params?.page ?? 0,
          pageSize: params?.pageSize ?? 10,
        },
      },
    },
    {
      enabled: !!org?.currentOrg?.id,
    }
  );

  return {
    ...result,
    data: result.data?.data || {
      purchases: [],
      total: 0,
      page: 0,
      pageSize: 10,
    },
  };
};

// A hook for creating a Stripe checkout session for adding credits
export const useCreateCheckoutSession = () => {
  return $JAWN_API.useMutation("post", "/v1/stripe/cloud/checkout-session", {
    onSuccess: (data) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      console.error("Failed to create checkout session:", error);
    },
  });
};