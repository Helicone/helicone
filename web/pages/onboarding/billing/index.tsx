import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDraftOnboardingStore } from "@/services/hooks/useOrgOnboarding";
import { TeamPlanCheckout } from "@/components/onboarding/Checkout/TeamPlanCheckout";
import { ProPlanCheckout } from "@/components/onboarding/Checkout/ProPlanCheckout";
import useNotification from "@/components/shared/notification/useNotification";

export default function BillingPage() {
  const org = useOrg();
  const router = useRouter();
  const { draftPlan, draftMembers, draftAddons } = useDraftOnboardingStore(
    org?.currentOrg?.id ?? ""
  )();
  const { setNotification } = useNotification();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const createdOrgId = org?.currentOrg?.id;

  // Move mutations to the top level
  const upgradeToPro = useMutation({
    mutationFn: async (variables: { addons: any; seats?: number }) => {
      const jawn = getJawnClient();
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
      const jawn = getJawnClient();
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

  const subscription = useQuery({
    queryKey: ["subscription", createdOrgId],
    queryFn: async (query) => {
      const jawn = getJawnClient();
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
    enabled: !!createdOrgId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error("Subscription query error:", error);
    },
  });

  useEffect(() => {
    if (
      subscription.data?.data?.status === "active" ||
      subscription.data?.data?.status === "trialing" ||
      subscription.data?.data?.status === "incomplete"
    ) {
      setNotification("You've already subscribed to Helicone!", "success");
      router.replace("/onboarding/integrate");
    }
  }, [subscription.data, router]);

  useEffect(() => {
    const createCheckoutSession = async () => {
      if (!createdOrgId || isCreatingCheckout) return;

      // Don't create a session if we don't have the plan selected
      if (!draftPlan) return;

      try {
        setIsCreatingCheckout(true);
        let result;

        if (draftPlan === "team") {
          result = await upgradeToTeamBundle.mutateAsync();
        } else {
          result = await upgradeToPro.mutateAsync({
            addons: draftAddons || {},
            seats: draftMembers.length,
          });
        }

        if (result.data) {
          setClientSecret(result.data);
        }
      } catch (error) {
        console.error("Error creating checkout session:", error);
      } finally {
        setIsCreatingCheckout(false);
      }
    };

    // Reset client secret when dependencies change
    setClientSecret(null);
    createCheckoutSession();
  }, [createdOrgId, draftPlan, draftMembers.length, draftAddons]); // Include all dependencies that should trigger a new checkout session

  if (subscription.isLoading) {
    return (
      <OnboardingHeader>
        <main className="mx-auto pt-12 px-4 max-w-4xl">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        </main>
      </OnboardingHeader>
    );
  }

  return (
    <OnboardingHeader>
      <main
        className={`mx-auto pt-12 px-4 ${
          draftPlan === "team" ? "max-w-7xl" : "max-w-4xl"
        }`}
      >
        <div className="max-w-[1000px] mx-auto">
          <header className="mb-8 ml-0 md:ml-16">
            <h1 className="text-2xl font-semibold">Add billing information</h1>
            <p className="text-sm text-slate-500 mt-2">
              You can add billing information later, but you&apos;ll need to do
              it before you can use Helicone.
            </p>
          </header>
        </div>

        {draftPlan === "team" ? (
          <TeamPlanCheckout clientSecret={clientSecret} />
        ) : (
          <ProPlanCheckout clientSecret={clientSecret} />
        )}
      </main>
    </OnboardingHeader>
  );
}
