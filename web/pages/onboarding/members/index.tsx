import { useOrg } from "@/components/layout/org/organizationContext";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { MembersStep } from "@/components/onboarding/Steps/MembersStep";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { H1, Muted } from "@/components/ui/typography";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingMembersPage() {
  const router = useRouter();
  const org = useOrg();
  const { setNotification } = useNotification();
  const { isLoading, updateCurrentStep, draftMembers } =
    useOrgOnboarding(org?.currentOrg?.id ?? "");

  useEffect(() => {
    updateCurrentStep("MEMBERS");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = () => {
    setNotification(
      draftMembers.length > 0
        ? `${draftMembers.length} member(s) added to your organization!`
        : "You can always invite members later from settings.",
      "success",
    );

    updateCurrentStep("REQUEST");
    router.push("/onboarding/request");
  };

  const handleSkip = () => {
    setNotification("You can always invite members later from settings.", "info");
    updateCurrentStep("REQUEST");
    router.push("/onboarding/request");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center">
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

          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button variant="action" onClick={handleContinue}>
              {draftMembers.length > 0
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