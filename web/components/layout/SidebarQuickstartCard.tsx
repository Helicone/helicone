import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuickstartStep } from "@/components/onboarding/QuickstartStep";
import { useOrg } from "@/components/layout/org/organizationContext";
import {
  OnboardingState,
  useOrgOnboarding,
} from "@/services/hooks/useOrgOnboarding";

const SidebarQuickstepCard = () => {
  const router = useRouter();
  const orgContext = useOrg();
  const {
    hasKeys,
    hasProviderKeys,
    refetchKeys,
    refetchProviderKeys,
    updateOnboardingStatus,
  } = useOrgOnboarding(orgContext?.currentOrg?.id ?? "");

  return (
    <div
      onClick={() => {
        router.push("/quickstart");
        refetchKeys();
        refetchProviderKeys();
      }}
      className="mx-2 mt-2 cursor-pointer rounded border border-border bg-background py-2"
    >
      <p className="mb-1 border-b border-border px-3 pb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
        Quickstart
      </p>
      <div className="space-y-1 px-3">
        <QuickstartStep
          stepNumber={1}
          isCompleted={hasProviderKeys}
          isActive={!hasProviderKeys}
        >
          Add provider key
        </QuickstartStep>
        <QuickstartStep
          stepNumber={2}
          isCompleted={hasKeys}
          isActive={hasProviderKeys && !hasKeys}
        >
          Create Helicone API key
        </QuickstartStep>
        <QuickstartStep
          stepNumber={3}
          isCompleted={!!orgContext?.currentOrg?.has_integrated}
          isActive={
            hasProviderKeys &&
            hasKeys &&
            !orgContext?.currentOrg?.has_integrated
          }
        >
          Integrate
        </QuickstartStep>
      </div>

      {hasProviderKeys && hasKeys && orgContext?.currentOrg?.has_integrated && (
        <div className="mt-2">
          <Button
            variant="outline"
            size="xs"
            onClick={async (e) => {
              e.stopPropagation();
              await updateOnboardingStatus({
                hasCompletedQuickstart: true,
              } as OnboardingState);
              router.push("/dashboard");
            }}
            className="w-full"
          >
            Finished!
          </Button>
        </div>
      )}
    </div>
  );
};

export default SidebarQuickstepCard;
