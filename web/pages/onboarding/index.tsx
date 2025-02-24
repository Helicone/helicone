"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useUser } from "@supabase/auth-helpers-react";
import { PlanType, useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import React, { useEffect } from "react";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { OrganizationStep } from "@/components/onboarding/Steps/OrganizationStep";
import { PlanStep } from "@/components/onboarding/Steps/PlanStep";
import { MemberRole, MembersTable } from "@/components/onboarding/MembersTable";
import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";

export default function OnboardingPage() {
  const router = useRouter();
  const org = useOrg();
  const user = useUser();
  const { setNotification } = useNotification();
  const {
    onboardingState,
    isLoading,
    draftName,
    draftPlan,
    draftMembers,
    setDraftMembers,
    setDraftPlan,
    updateCurrentStep,
  } = useOrgOnboarding(org?.currentOrg?.id ?? "");

  useEffect(() => {
    updateCurrentStep("ORGANIZATION");
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
    onError: (error) => {
      console.error("Subscription query error:", error);
    },
  });

  const isSubscribed =
    subscription.data?.data?.status === "active" ||
    subscription.data?.data?.status === "trialing" ||
    subscription.data?.data?.status === "incomplete";

  const handlePlanChange = (plan: PlanType) => {
    setDraftPlan(plan);

    if (plan !== "free") {
      updateCurrentStep("MEMBERS");
    } else {
      updateCurrentStep("ORGANIZATION");
    }
  };

  const handleAddMember = (email: string, role: MemberRole) => {
    setDraftMembers([...draftMembers, { email, role }]);
  };

  const handleRemoveMember = (email: string) => {
    setDraftMembers(draftMembers.filter((m) => m.email !== email));
  };

  const handleOrganizationSubmit = () => {
    if (!draftName) return;

    setNotification(
      onboardingState?.name && onboardingState.name !== "My Organization"
        ? "Organization updated!"
        : "Organization created!",
      "success"
    );

    if (isSubscribed) {
      updateCurrentStep("INTEGRATION");
      router.push("/onboarding/integrate");
    } else if (draftPlan !== "free") {
      updateCurrentStep("BILLING");
      router.push("/onboarding/billing");
    } else {
      updateCurrentStep("INTEGRATION");
      router.push("/onboarding/integrate");
    }
  };

  if (subscription.isLoading || isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center">
        <OnboardingHeader />
        <div className="flex flex-col gap-4 w-full max-w-md px-4 mt-12">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingHeader>
      <div className="flex flex-col gap-4 w-full max-w-md px-4 mt-12 mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Welcome to Helicone! 👋</h1>
          <div className="text-sm font-light text-slate-500">
            {isSubscribed
              ? "Update your organization name below."
              : "Glad to have you here. Create your first organization."}
          </div>
        </div>

        <OrganizationStep />

        {!isSubscribed && (
          <>
            <PlanStep onPlanChange={handlePlanChange} />

            {!isLoading && draftPlan !== "free" && (
              <MembersTable
                members={draftMembers}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                ownerEmail={user?.email ?? ""}
              />
            )}
          </>
        )}

        {isSubscribed && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
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
            {onboardingState?.name && onboardingState.name !== "My Organization"
              ? "Update organization"
              : "Create organization"}
          </Button>
        </div>
      </div>
    </OnboardingHeader>
  );
}
