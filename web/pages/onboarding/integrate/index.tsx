import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useOrgOnboardingStore } from "@/store/onboardingStore";
import { useEffect } from "react";

export default function IntegratePage() {
  const { setCurrentStep } = useOrgOnboardingStore();

  useEffect(() => {
    setCurrentStep("INTEGRATION");
  }, []);

  return (
    <div>
      <OnboardingHeader />
      <div className="mx-auto pt-12 px-4">
        <div>Integrate</div>
      </div>
    </div>
  );
}
