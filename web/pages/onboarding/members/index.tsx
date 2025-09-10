import { useOrg } from "@/components/layout/org/organizationContext";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { MembersStep } from "@/components/onboarding/Steps/MembersStep";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { H1, Muted } from "@/components/ui/typography";
import { useAddOrgMemberMutation } from "@/services/hooks/organizations";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingMembersPage() {
  const router = useRouter();
  const org = useOrg();
  const { setNotification } = useNotification();
  const { isLoading, updateCurrentStep, draftMembers, setDraftMembers } =
    useOrgOnboarding(org?.currentOrg?.id ?? "");

  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const addMemberMutation = useAddOrgMemberMutation();

  useEffect(() => {
    updateCurrentStep("MEMBERS");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleContinue = async () => {
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
    } else {
      setNotification(
        "You can always invite members later from settings.",
        "info",
      );
    }

    updateCurrentStep("REQUEST");
    router.push("/onboarding/request");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center">
        <OnboardingHeader />
        <div className="mx-auto mt-12 w-full max-w-2xl px-4">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-32 w-full" />
              <div className="flex justify-between gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingHeader>
      <div className="mx-auto mt-12 w-full max-w-2xl px-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <H1>Invite your team</H1>
            <Muted>
              Add team members to collaborate on your Helicone organization. You
              can always do this later from your organization settings.
            </Muted>
          </div>

          <MembersStep />

          <div className="flex justify-end gap-4">
            <Button
              variant="action"
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
          </div>
        </div>
      </div>
    </OnboardingHeader>
  );
}
