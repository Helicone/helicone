import { useOrg } from "../../components/layout/org/organizationContext";
import { $JAWN_API } from "../../lib/clients/jawn";

// Types matching the backend
export interface PurchasedCredits {
  id: string; // Always the payment intent ID
  createdAt: number;
  credits: number;
  status?: string;
  isRefunded?: boolean;
  refundedAmount?: number;
  refundIds?: string[];
}

export interface PaginatedPurchasedCredits {
  purchases: PurchasedCredits[];
  total: number;
  nextPage: string | null;
  hasMore: boolean;
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
    },
  );

  return {
    ...result,
    data: result.data?.data || { balance: 0 },
  };
};

// Interface for the payment intent record from backend
interface PaymentIntentRecord {
  id: string; // Always the payment intent ID
  amount: number;
  created: number;
  status: string;
  isRefunded?: boolean;
  refundedAmount?: number;
  refundIds?: string[];
}

// Interface for the Stripe API response
interface StripePaymentIntentsResponse {
  data: PaymentIntentRecord[];
  has_more: boolean;
  next_page: string | null;
  count: number;
}

// A hook for fetching credit balance transactions with pagination
export const useCreditTransactions = (params?: {
  limit?: number;
  page?: string | null;
}) => {
  const org = useOrg();

  const result = $JAWN_API.useQuery(
    "get",
    "/v1/stripe/payment-intents/search",
    {
      params: {
        query: {
          search_kind: "credit_purchases",
          limit: params?.limit ?? 10,
          ...(params?.page && { page: params.page }),
        },
      },
    },
    {
      enabled: !!org?.currentOrg?.id,
    },
  );

  // Transform the response data
  const transformedData = result.data
    ? (() => {
        const data = result.data as StripePaymentIntentsResponse;
        
        // Transform Stripe payment intents to our format
        const purchases: PurchasedCredits[] = (data.data || []).map((intent) => ({
          id: intent.id, // Always the payment intent ID
          createdAt: intent.created * 1000, // Convert from seconds to milliseconds
          credits: intent.amount || 0, // Amount is in cents
          status: intent.status,
          isRefunded: intent.isRefunded,
          refundedAmount: intent.refundedAmount,
          refundIds: intent.refundIds,
        }));

        return {
          purchases,
          total: data.count || 0,
          nextPage: data.next_page || null,
          hasMore: data.has_more || false,
        };
      })()
    : {
        purchases: [],
        total: 0,
        nextPage: null,
        hasMore: false,
      };

  return {
    ...result,
    data: transformedData,
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

// Types for spend breakdown
export interface ModelSpend {
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  pricing: {
    inputPer1M: number;
    outputPer1M: number;
  } | null;
  subtotal: number; // Cost before discount
  discountPercent: number; // 0-100
  total: number; // Cost after discount
}

export interface SpendBreakdownResponse {
  models: ModelSpend[];
  totalCost: number;
  timeRange: { start: string; end: string };
}

export type SpendTimeRange = "7d" | "30d" | "90d" | "all";

// A hook for fetching spend breakdown by model
// Can use either preset timeRange or custom startDate/endDate
export const useSpendBreakdown = (
  options:
    | { timeRange: SpendTimeRange }
    | { startDate: Date; endDate: Date }
) => {
  const org = useOrg();

  const isCustomRange = "startDate" in options;

  // Build query params
  const queryParams = isCustomRange
    ? {
        startDate: options.startDate.toISOString(),
        endDate: options.endDate.toISOString(),
      }
    : {
        timeRange: options.timeRange,
      };

  const result = $JAWN_API.useQuery(
    "get",
    "/v1/credits/spend/breakdown",
    {
      params: {
        query: queryParams,
      },
    },
    {
      enabled: !!org?.currentOrg?.id,
      staleTime: 0, // Don't cache - always refetch
    }
  );

  return {
    ...result,
    data: result.data?.data as SpendBreakdownResponse | undefined,
  };
};

// Types for PTB invoices
export interface PTBInvoice {
  id: string;
  organizationId: string;
  stripeInvoiceId: string | null;
  hostedInvoiceUrl: string | null;
  startDate: string;
  endDate: string;
  amountCents: number;
  notes: string | null;
  createdAt: string;
}

// A hook for fetching invoices for the current org
export const useInvoices = () => {
  const org = useOrg();

  const result = $JAWN_API.useQuery(
    "get",
    "/v1/credits/invoices",
    {},
    {
      enabled: !!org?.currentOrg?.id,
    }
  );

  return {
    ...result,
    data: (result.data?.data as PTBInvoice[] | undefined) ?? [],
  };
};
