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
    orgContext?.currentOrg?.id || ""
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

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 pointer-events-none"
      style={{ top: navbarHeight }}
    >
      {/* Gradient overlay that fades from transparent to white/black */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent dark:hidden"
        style={{ top: "20%" }}
      />

      {/* Dark mode version of the gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-black/80 to-transparent hidden dark:block"
        style={{ top: "20%" }}
      />

      {/* CTA Container with gradient top - Light Mode */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-auto dark:hidden"
        style={{
          top: "min(66%, 400px)",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 8%, white 15%)",
        }}
      >
        {/* Content container */}
        <div className="relative w-full pt-8 sm:pt-12 md:pt-16 pb-8 px-4 sm:px-8 flex justify-center">
          {/* Sidebar offset container - no transform on small screens, offset on medium+ */}
          <div className="w-full max-w-3xl flex flex-col gap-6 items-center md:translate-x-[calc(var(--sidebar-width,0px)/2)]">
            <div className="flex flex-col gap-2 text-center w-full">
              <H2>Integrate to unlock your analytics</H2>
              <Large className="max-w-lg lg:max-w-3xl mx-auto">
                This is a preview. Integrate your LLM app with Helicone to see
                your real-time insights.
              </Large>
            </div>

            <div className="flex gap-4 justify-center">
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

      {/* CTA Container with gradient top - Dark Mode */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-auto hidden dark:block"
        style={{
          top: "min(66%, 400px)",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.95) 8%, rgb(0,0,0) 15%)",
        }}
      >
        {/* Content container */}
        <div className="relative w-full pt-8 sm:pt-12 md:pt-16 pb-8 px-4 sm:px-8 flex justify-center">
          {/* Sidebar offset container - no transform on small screens, offset on medium+ */}
          <div className="w-full max-w-3xl flex flex-col gap-6 items-center md:translate-x-[calc(var(--sidebar-width,0px)/2)]">
            <div className="flex flex-col gap-2 text-center w-full">
              <H2>Integrate to unlock your analytics</H2>
              <Large className="max-w-lg lg:max-w-3xl mx-auto">
                This is a preview. Integrate your LLM app with Helicone to see
                your real-time insights.
              </Large>
            </div>

            <div className="flex gap-4 justify-center">
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
  );
}
