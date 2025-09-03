"use client";
import { useOrg } from "@/components/layout/org/organizationContext";

import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { OrganizationStep } from "@/components/onboarding/Steps/OrganizationStep";
import useNotification from "@/components/shared/notification/useNotification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const org = useOrg();
  const { setNotification } = useNotification();
  const { onboardingState, isLoading, draftName, updateCurrentStep } =
    useOrgOnboarding(org?.currentOrg?.id ?? "");

  useEffect(() => {
    updateCurrentStep("ORGANIZATION");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient();
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
    enabled: !!org?.currentOrg?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const isSubscribed =
    subscription.data?.data?.status === "active" ||
    subscription.data?.data?.status === "trialing" ||
    subscription.data?.data?.status === "incomplete";

  const handleOrganizationSubmit = () => {
    if (!draftName) return;

    setNotification(
      onboardingState?.name && onboardingState.name !== "My Organization"
        ? "Organization updated!"
        : "Organization created!",
      "success",
    );

    updateCurrentStep("MEMBERS");
    router.push("/onboarding/members");
  };

  if (subscription.isLoading || isLoading) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center">
        <OnboardingHeader />
        <div className="mx-auto mt-12 w-full max-w-md px-4">
          <div className="flex flex-col gap-4">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingHeader>
      <div className="mx-auto mt-12 w-full max-w-md px-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <H1>Welcome to Helicone! 👋</H1>
            <Muted>
              {isSubscribed
                ? "Update your organization name below."
                : "Glad to have you here. Create your first organization."}
            </Muted>
          </div>

          <OrganizationStep />

          {isSubscribed && (
            <Alert className="border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
              <Info size={16} />
              <AlertDescription className="text-[hsl(var(--muted-foreground))]">
                Already subscribed! You can update your organization name here.
                Visit settings for plan or member changes.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              variant="action"
              className="w-full"
              onClick={handleOrganizationSubmit}
              disabled={!draftName}
            >
              {onboardingState?.name &&
              onboardingState.name !== "My Organization"
                ? "Update organization"
                : "Create organization"}
            </Button>
          </div>
        </div>
      </div>
    </OnboardingHeader>
  );
}
