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
import { logger } from "@/lib/telemetry/logger";

export default function BillingPage() {
  const org = useOrg();
  const router = useRouter();
  const { draftPlan, draftMembers, draftAddons } = useDraftOnboardingStore(
    org?.currentOrg?.id ?? "",
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
    queryFn: async () => {
      const jawn = getJawnClient();
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
    enabled: !!createdOrgId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
            seats: draftMembers.length + 1, // +1 for the owner
          });
        }

        if (result.data) {
          setClientSecret(result.data);
        }
      } catch (error) {
        logger.error({ error }, "Error creating checkout session");
      } finally {
        setIsCreatingCheckout(false);
      }
    };

    // Reset client secret when dependencies change
    setClientSecret(null);
    createCheckoutSession();
  }, [createdOrgId, draftPlan, draftMembers.length, draftAddons]);

  if (subscription.isLoading) {
    return (
      <OnboardingHeader>
        <main className="mx-auto max-w-4xl px-4 pt-12">
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
        className={`mx-auto px-4 pt-12 ${
          draftPlan === "team" ? "max-w-7xl" : "max-w-4xl"
        }`}
      >
        <div className="mx-auto max-w-[1000px]">
          <header className="mb-8 ml-0 md:ml-16">
            <h1 className="text-2xl font-semibold">Add billing information</h1>
            <p className="mt-2 text-sm text-slate-500">
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
