"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { useOrg } from "@/components/layout/org/organizationContext";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useUser } from "@supabase/auth-helpers-react";
import { getJawnClient } from "@/lib/clients/jawn";
import {
  MemberRole,
  PlanType,
  useOrgOnboardingStore,
} from "@/store/onboardingStore";
import useNotification from "@/components/shared/notification/useNotification";

import React from "react";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { OrganizationStep } from "@/components/onboarding/Steps/OrganizationStep";
import { PlanStep } from "@/components/onboarding/Steps/PlanStep";
import { MembersTable } from "@/components/onboarding/MembersTable";

interface Member {
  email: string;
  role: MemberRole;
}

interface OrganizationForm {
  name: string;
  plan: PlanType;
  members: Member[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const org = useOrg();
  const user = useUser();
  const { setNotification } = useNotification();
  const {
    currentStep,
    formData,
    createdOrgId,
    setCurrentStep,
    setFormData,
    setCreatedOrgId,
  } = useOrgOnboardingStore();
  const [nameError, setNameError] = useState("");

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient();
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
    enabled: !!org?.currentOrg?.id,
  });

  const { mutate: updateOrganization } = useMutation({
    mutationFn: async (data: OrganizationForm) => {
      const jawn = getJawnClient();
      const { error: updateOrgError, data: responseData } = await jawn.POST(
        "/v1/organization/{organizationId}/update",
        {
          body: {
            name: data.name,
          },
          params: {
            path: {
              organizationId: createdOrgId ?? "",
            },
          },
        }
      );

      if (updateOrgError) {
        setNotification(
          "Failed to update organization: " + updateOrgError,
          "error"
        );
        return { error: updateOrgError, data: null };
      }

      return { error: null, data: responseData.data };
    },
    onSuccess: (response) => {
      if (response.data) {
        setNotification("Organization updated successfully!", "success");
        org?.setCurrentOrg(response.data);
        org?.refetchOrgs?.();
      }
    },
  });

  const { mutate: createOrganization } = useMutation({
    mutationFn: async (data: OrganizationForm) => {
      const jawn = getJawnClient();
      const { error: createOrgError, data: responseData } = await jawn.POST(
        "/v1/organization/create",
        {
          body: {
            name: data.name,
            owner: user?.id!,
            color: "blue",
            icon: "code",
            has_onboarded: false,
            tier: "free",
          },
        }
      );

      if (createOrgError) {
        setNotification(
          "Failed to create organization: " + createOrgError,
          "error"
        );
        return { error: createOrgError, data: null };
      }

      return { error: null, data: responseData.data };
    },
    onSuccess: (response) => {
      if (response.data) {
        console.log("Created org:", response.data);
        setNotification("Organization created successfully!", "success");
        console.log("Setting current org to:", response.data);
        org?.setCurrentOrg(response.data);
        org?.refetchOrgs?.();
        setCreatedOrgId(response.data);
        console.log("New org context:", org);
      }
    },
  });

  const handlePlanChange = (plan: PlanType) => {
    setFormData({ plan });
    if (plan === "pro") setCurrentStep("MEMBERS");
  };

  const handleAddMember = (email: string, role: MemberRole) => {
    setFormData({
      members: [...formData.members, { email, role }],
    });
  };

  const handleRemoveMember = (email: string) => {
    setFormData({
      members: formData.members.filter((m) => m.email !== email),
    });
  };

  const handleOrganizationSubmit = () => {
    if (!formData.name) return;

    if (createdOrgId) {
      updateOrganization(formData);
    } else {
      createOrganization(formData);
    }

    if (formData.plan === "pro" || formData.plan === "team") {
      setCurrentStep("BILLING");
      router.push("/onboarding/billing");
    } else {
      setCurrentStep("INTEGRATION");
      router.push("/onboarding/integrate");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      <OnboardingHeader />
      <div className="flex flex-col gap-4 w-full max-w-md px-4 mt-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Welcome to Helicone! 👋</h1>
          <div className="text-md font-light text-slate-500">
            Glad to have you here. Create your first organization.
          </div>
        </div>

        <OrganizationStep
          name={formData.name}
          onNameChange={(name) => {
            setFormData({ name });
            setNameError(name ? "" : "Please enter an organization name :)");
          }}
        />

        <PlanStep
          plan={formData.plan}
          onPlanChange={handlePlanChange}
          onComplete={() => setCurrentStep("MEMBERS")}
        />

        {formData.plan !== "free" && (
          <MembersTable
            members={formData.members}
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
            disabled={!formData.name || !formData.plan}
          >
            {createdOrgId ? "Update organization" : "Create organization"}
          </Button>
        </div>
      </div>
    </div>
  );
}
