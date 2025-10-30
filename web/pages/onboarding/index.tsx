"use client";
import { useOrg } from "@/components/layout/org/organizationContext";

import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { OrganizationStep } from "@/components/onboarding/Steps/OrganizationStep";
import { MembersStep } from "@/components/onboarding/Steps/MembersStep";
import useNotification from "@/components/shared/notification/useNotification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { useAddOrgMemberMutation } from "@/services/hooks/organizations";
import { useQuery } from "@tanstack/react-query";
import { Info, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const org = useOrg();
  const { setNotification } = useNotification();
  const { onboardingState, isLoading, draftName, draftMembers, setDraftMembers, updateCurrentStep, updateOnboardingStatus, saveOrganizationName } =
    useOrgOnboarding(org?.currentOrg?.id ?? "");

  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [hasCreatedOrg, setHasCreatedOrg] = useState(false);
  const addMemberMutation = useAddOrgMemberMutation();

  useEffect(() => {
    updateCurrentStep("ORGANIZATION");

    // Fire Google Ads conversion event for Sign Up
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag('event', 'ads_conversion_Sign_Up_1', {
        // <event_parameters>
      });
    }
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

  const sendMemberInvitations = async () => {
    if (draftMembers.length === 0)
      return { success: true, errors: [], successCount: 0, totalCount: 0 };

    setIsSendingInvites(true);
    const errors: string[] = [];
    const orgId = org?.currentOrg?.id ?? "";

    try {
      const invitationPromises = draftMembers.map(async (member) => {
        try {
          await addMemberMutation.mutateAsync({
            params: {
              path: {
                organizationId: orgId,
              },
            },
            body: {
              email: member.email,
            },
          });
          return { success: true, email: member.email };
        } catch (error: any) {
          const errorMessage = error.error || "Failed to invite member";
          errors.push(`Failed to invite ${member.email}: ${errorMessage}`);
          return { success: false, email: member.email, error: errorMessage };
        }
      });

      const results = await Promise.all(invitationPromises);
      const successCount = results.filter((r) => r.success).length;

      return {
        success: errors.length === 0,
        errors,
        successCount,
        totalCount: draftMembers.length,
      };
    } catch (error) {
      console.error("Error sending invitations:", error);
      errors.push("Unexpected error occurred while sending invitations");
      return {
        success: false,
        errors,
        successCount: 0,
        totalCount: draftMembers.length,
      };
    } finally {
      setIsSendingInvites(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!draftName) return;

    // Save the organization name WITHOUT clearing the draft
    await saveOrganizationName();

    setNotification(
      onboardingState?.name && onboardingState.name !== "My Organization"
        ? "Organization updated!"
        : "Organization created!",
      "success",
    );

    // Show members section
    setHasCreatedOrg(true);
  };

  const handleContinue = async () => {
    // Send member invitations if any
    if (draftMembers.length > 0) {
      const result = await sendMemberInvitations();

      if (result.success) {
        setNotification(
          `Successfully invited ${result.successCount ?? 0} member${(result.successCount ?? 0) !== 1 ? "s" : ""} to your organization!`,
          "success",
        );
        setDraftMembers([]);
      } else if ((result.successCount ?? 0) > 0) {
        setNotification(
          `Partially successful: ${result.successCount ?? 0}/${result.totalCount ?? 0} invitations sent. Some failed.`,
          "error",
        );
        result.errors.forEach((error) => console.error(error));
      } else {
        setNotification(
          "Failed to send member invitations. Please try again or add members later from settings.",
          "error",
        );
        result.errors.forEach((error) => console.error(error));
        return;
      }
    }

    // Navigate to quickstart
    router.push("/quickstart");
  };

  if (subscription.isLoading || isLoading) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center">
        <OnboardingHeader />
        <div className="mx-auto mt-12 w-full max-w-2xl px-4">
          <div className="flex flex-col gap-4">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingHeader>
      <div className="mx-auto mt-12 w-full max-w-2xl px-4">
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

          {hasCreatedOrg && (
            <>
              <div className="flex flex-col gap-2 pt-4">
                <h3 className="text-sm font-medium">Invite team members (optional)</h3>
                <Muted className="text-xs">
                  Add team members to collaborate on your Helicone organization. You
                  can always do this later from your organization settings.
                </Muted>
              </div>

              <MembersStep />
            </>
          )}

          <div className="flex justify-end">
            {!hasCreatedOrg ? (
              <Button
                variant="action"
                className="w-full"
                onClick={handleCreateOrganization}
                disabled={!draftName}
              >
                {onboardingState?.name &&
                onboardingState.name !== "My Organization"
                  ? "Update organization"
                  : "Create organization"}
              </Button>
            ) : (
              <Button
                variant="action"
                className="w-full"
                onClick={handleContinue}
                disabled={isSendingInvites}
              >
                {isSendingInvites && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSendingInvites
                  ? "Sending invitations..."
                  : draftMembers.length > 0
                    ? `Continue with ${draftMembers.length} member${
                        draftMembers.length > 1 ? "s" : ""
                      }`
                    : "Continue"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </OnboardingHeader>
  );
}
