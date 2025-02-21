"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useUser } from "@supabase/auth-helpers-react";
import { getJawnClient } from "@/lib/clients/jawn";
import { MemberRole, PlanType } from "@/store/onboardingStore";
import useNotification from "@/components/shared/notification/useNotification";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { useMutation, useQuery } from "@tanstack/react-query";

import React from "react";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { OrganizationStep } from "@/components/onboarding/Steps/OrganizationStep";
import { PlanStep } from "@/components/onboarding/Steps/PlanStep";
import { MembersTable } from "@/components/onboarding/MembersTable";

export default function OnboardingPage() {
  const router = useRouter();
  const org = useOrg();
  const user = useUser();
  const { setNotification } = useNotification();
  const [nameError, setNameError] = useState("");

  console.log(`Orgs: ${JSON.stringify(org?.allOrgs)}`);
  console.log(`Current Org: ${JSON.stringify(org?.currentOrg)}`);
  const { onboardingState, updateFormData, setCurrentStep } = useOrgOnboarding(
    org?.currentOrg?.id ?? ""
  );

  console.log(`onboardingState: ${JSON.stringify(onboardingState)}`);

  // Subscription query
  const { data: subscription } = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: () => getJawnClient().GET("/v1/stripe/subscription"),
    enabled: !!org?.currentOrg?.id,
  });

  const { mutate: updateOrganization } = useMutation({
    mutationFn: async (data: {
      name: string;
      plan: PlanType;
      members: Array<{ email: string; role: MemberRole }>;
    }) => {
      const { error, data: responseData } = await getJawnClient().POST(
        "/v1/organization/{organizationId}/update",
        {
          body: { name: data.name },
          params: { path: { organizationId: org?.currentOrg?.id ?? "" } },
        }
      );

      if (error) {
        setNotification("Failed to update organization: " + error, "error");
        return { error: error, data: null };
      }

      return { error: null, data: null };
    },
    onSuccess: () => {
      setNotification("Organization updated successfully!", "success");
      org?.refetchOrgs?.();

      // Navigate based on plan
      if (onboardingState?.formData.plan === "free") {
        setCurrentStep("INTEGRATION");
        router.push("/onboarding/integrate");
      } else {
        setCurrentStep("BILLING");
        router.push("/onboarding/billing");
      }
    },
    onError: (error) => {
      setNotification("Failed to update organization: " + error, "error");
    },
  });

  const handlePlanChange = (plan: PlanType) => {
    updateFormData({ plan });
    if (plan === "pro") setCurrentStep("MEMBERS");
  };

  const handleAddMember = (email: string, role: MemberRole) => {
    updateFormData({
      members: [...(onboardingState?.formData.members ?? []), { email, role }],
    });
  };

  const handleRemoveMember = (email: string) => {
    updateFormData({
      members:
        onboardingState?.formData.members.filter((m) => m.email !== email) ??
        [],
    });
  };

  const handleOrganizationSubmit = () => {
    if (!onboardingState?.formData.name) return;
    updateOrganization(onboardingState.formData);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      <OnboardingHeader />
      <div className="flex flex-col gap-4 w-full max-w-md px-4 mt-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Welcome to Helicone! 👋</h1>
          <div className="text-md font-light text-slate-500">
            Glad to have you here. Create your first organization.
          </div>
        </div>

        <OrganizationStep
          name={onboardingState?.formData.name ?? ""}
          onNameChange={(name) => {
            updateFormData({ name });
            setNameError(name ? "" : "Please enter an organization name :)");
          }}
        />

        <PlanStep
          plan={onboardingState?.formData.plan ?? "free"}
          onPlanChange={handlePlanChange}
          onComplete={() => setCurrentStep("MEMBERS")}
        />

        {onboardingState?.formData.plan !== "free" && (
          <MembersTable
            members={onboardingState?.formData.members ?? []}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            ownerEmail={user?.email ?? ""}
          />
        )}

        <div className="flex justify-end">
          <Button
            variant="action"
            className="w-full"
            onClick={handleOrganizationSubmit}
            disabled={!onboardingState?.formData.name}
          >
            {onboardingState?.formData.name
              ? "Update organization"
              : "Create organization"}
          </Button>
        </div>
      </div>
    </div>
  );
}
