import { useOrg } from "../../components/layout/org/organizationContext";
import { $JAWN_API } from "../../lib/clients/jawn";
import { useQueryClient } from "@tanstack/react-query";

// Types matching the backend
export interface AutoTopoffSettings {
  enabled: boolean;
  thresholdCents: number;
  topoffAmountCents: number;
  stripePaymentMethodId: string | null;
  lastTopoffAt: string | null;
  consecutiveFailures: number;
}

export interface UpdateAutoTopoffSettingsRequest {
  enabled: boolean;
  thresholdCents: number;
  topoffAmountCents: number;
  stripePaymentMethodId: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

// Hook for fetching auto topoff settings
export const useAutoTopoffSettings = () => {
  const org = useOrg();

  const result = $JAWN_API.useQuery(
    "get",
    "/v1/stripe/auto-topoff/settings",
    {},
    {
      enabled: !!org?.currentOrg?.id,
    }
  );

  return {
    ...result,
    data: result.data || null,
  };
};

// Hook for updating auto topoff settings
export const useUpdateAutoTopoffSettings = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation("post", "/v1/stripe/auto-topoff/settings", {
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/stripe/auto-topoff/settings"],
      });
    },
    onError: (error) => {
      console.error("Failed to update auto topoff settings:", error);
    },
  });
};

// Hook for disabling auto topoff
export const useDisableAutoTopoff = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation("delete", "/v1/stripe/auto-topoff/settings", {
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/stripe/auto-topoff/settings"],
      });
    },
    onError: (error) => {
      console.error("Failed to disable auto topoff:", error);
    },
  });
};

// Hook for fetching payment methods
export const usePaymentMethods = () => {
  const org = useOrg();

  const result = $JAWN_API.useQuery(
    "get",
    "/v1/stripe/payment-methods",
    {},
    {
      enabled: !!org?.currentOrg?.id,
    }
  );

  return {
    ...result,
    data: result.data || [],
  };
};

// Hook for creating setup session (to add payment methods)
export const useCreateSetupSession = () => {
  return $JAWN_API.useMutation("post", "/v1/stripe/payment-methods/setup-session", {
    onSuccess: (data) => {
      if (data?.setupUrl) {
        window.location.href = data.setupUrl;
      }
    },
    onError: (error) => {
      console.error("Failed to create setup session:", error);
    },
  });
};

// Hook for removing payment method
export const useRemovePaymentMethod = () => {
  const queryClient = useQueryClient();

  return $JAWN_API.useMutation("delete", "/v1/stripe/payment-methods/{paymentMethodId}", {
    onSuccess: () => {
      // Invalidate payment methods query
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/stripe/payment-methods"],
      });
    },
    onError: (error) => {
      console.error("Failed to remove payment method:", error);
    },
  });
};
