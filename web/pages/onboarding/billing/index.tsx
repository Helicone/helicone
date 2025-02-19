import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useOrgOnboardingStore } from "@/store/onboardingStore";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import LoadingAnimation from "@/components/shared/loadingAnimation";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  {
    betas: ["custom_checkout_beta_5"],
  }
);

export default function BillingPage() {
  const org = useOrg();
  const router = useRouter();
  const { formData, currentStep, setCurrentStep, setFormData } =
    useOrgOnboardingStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Check if they're an existing customer
  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient();
      const subscription = await jawn.GET("/v1/stripe/subscription");
      console.log("Subscription response:", subscription);
      return subscription;
    },
    enabled: !!org?.currentOrg?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (subscription.data?.data?.status === "active") {
      router.replace("/onboarding/integrate");
    }
  }, [subscription.data, router]);

  const upgradeToPro = useMutation({
    mutationFn: async (variables: { addons: any; seats?: number }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const endpoint =
        subscription.data?.data?.status === "canceled"
          ? "/v1/stripe/subscription/existing-customer/upgrade-to-pro"
          : "/v1/stripe/subscription/new-customer/upgrade-to-pro";

      const result = await jawn.POST(endpoint, {
        body: {
          addons: {
            prompts: variables.addons.prompts,
            experiments: variables.addons.experiments,
            evals: variables.addons.evals,
          },
          seats: variables.seats,
          ui_mode: "embedded",
        },
      });
      return result;
    },
  });

  const upgradeToTeamBundle = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const endpoint =
        subscription.data?.data?.status === "canceled"
          ? "/v1/stripe/subscription/existing-customer/upgrade-to-team-bundle"
          : "/v1/stripe/subscription/new-customer/upgrade-to-team-bundle";

      const result = await jawn.POST(endpoint, {
        body: {
          ui_mode: "embedded",
        },
      });
      return result;
    },
  });

  const isLoading = upgradeToPro.isLoading || upgradeToTeamBundle.isLoading;

  // Add this effect to create checkout session on page load
  useEffect(() => {
    const createCheckoutSession = async () => {
      if (!org?.currentOrg?.id) return;

      try {
        let result;

        if (formData.plan === "team") {
          result = await upgradeToTeamBundle.mutateAsync();
        } else {
          result = await upgradeToPro.mutateAsync({
            addons: {
              prompts: false,
              experiments: false,
              evals: false,
            },
            seats: formData.members.length,
          });
        }

        if (result.data) {
          setClientSecret(result.data);
        }
      } catch (error) {
        console.error("Error creating checkout session:", error);
      }
    };

    createCheckoutSession();
  }, [org?.currentOrg?.id, formData.plan, formData.members.length]);

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Progress Header */}
      <OnboardingHeader />
      <div className="mx-auto pt-12 px-4">
        {isLoading ? (
          <LoadingAnimation />
        ) : clientSecret ? (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout className="w-full h-full bg-white" />
          </EmbeddedCheckoutProvider>
        ) : (
          <div className="text-center text-gray-600">
            Failed to load checkout. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
