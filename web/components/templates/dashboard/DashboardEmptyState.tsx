import { Button } from "@/components/ui/button";
import { H2, Large } from "@/components/ui/typography";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/router";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { STEP_ROUTES } from "@/components/onboarding/OnboardingHeader";

interface DashboardEmptyStateProps {
  isVisible: boolean;
}

export default function DashboardEmptyState({
  isVisible,
}: DashboardEmptyStateProps) {
  const router = useRouter();
  const orgContext = useOrg();
  const { onboardingState } = useOrgOnboarding(
    orgContext?.currentOrg?.id || "",
  );

  if (!isVisible) return null;

  const handleDemoClick = () => {
    const demoOrg = orgContext?.allOrgs.find((org) => org.tier === "demo");
    if (demoOrg && orgContext?.setCurrentOrg) {
      orgContext.setCurrentOrg(demoOrg.id);
    }
  };

  const handleQuickStart = () => {
    const currentStep = onboardingState?.currentStep || "ORGANIZATION";
    if (currentStep === "EVENT") {
      router.push("/onboarding/integrate");
    } else {
      router.push(STEP_ROUTES[currentStep]);
    }
  };

  // Navbar height is approximately 60px
  const navbarHeight = "60px";

  // Position factor: increase for lower position, decrease for higher position
  // Current value: 68 (ranges typically between 60-90)
  const positionFactor = 65;

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-40"
      style={{ top: navbarHeight }}
    >
      {/* Gradient overlay that fades from transparent to white/black */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:hidden"
        style={{ top: "20%" }}
      />

      {/* Dark mode version of the gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-black via-black/80 to-transparent dark:block"
        style={{ top: "20%" }}
      />

      {/* CTA Container with gradient top - Light Mode */}
      <div
        className="pointer-events-auto absolute left-0 right-0 dark:hidden"
        style={{
          top: `${positionFactor}%`,
          height: `${100 - positionFactor}%`,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 8%, white 15%)",
        }}
      >
        {/* Content container - centered vertically and horizontally */}
        <div className="relative flex h-full w-full flex-col justify-center">
          <div className="flex w-full justify-center px-4 py-8 sm:px-6 lg:px-8">
            {/* Sidebar offset container - no transform on small screens, offset on medium+ */}
            <div className="flex w-full max-w-3xl flex-col items-center gap-6 md:translate-x-[calc(var(--sidebar-width,0px)/2)]">
              <div className="flex w-full flex-col gap-2 text-center">
                <H2>Integrate to unlock your analytics</H2>
                <Large className="mx-auto max-w-lg lg:max-w-3xl">
                  This is a preview. Integrate your LLM app with Helicone to see
                  your real-time insights.
                </Large>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleDemoClick}>
                  Try Demo
                </Button>
                <Button variant="action" onClick={handleQuickStart}>
                  Quick Start <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Container with gradient top - Dark Mode */}
      <div
        className="pointer-events-auto absolute left-0 right-0 hidden dark:block"
        style={{
          top: `${positionFactor}%`,
          height: `${100 - positionFactor}%`,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.95) 8%, rgb(0,0,0) 15%)",
        }}
      >
        {/* Content container - centered vertically and horizontally */}
        <div className="relative flex h-full w-full flex-col justify-center">
          <div className="flex w-full justify-center px-4 py-8 sm:px-6 lg:px-8">
            {/* Sidebar offset container - no transform on small screens, offset on medium+ */}
            <div className="flex w-full max-w-3xl flex-col items-center gap-6 md:translate-x-[calc(var(--sidebar-width,0px)/2)]">
              <div className="flex w-full flex-col gap-2 text-center">
                <H2>Integrate to unlock your analytics</H2>
                <Large className="mx-auto max-w-lg lg:max-w-3xl">
                  This is a preview. Integrate your LLM app with Helicone to see
                  your real-time insights.
                </Large>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleDemoClick}>
                  Try Demo
                </Button>
                <Button variant="action" onClick={handleQuickStart}>
                  Quick Start <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
