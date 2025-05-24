import { useOrg } from "@/components/layout/org/organizationContext";
import { STEP_ROUTES } from "@/components/onboarding/OnboardingHeader";
import { Button } from "@/components/ui/button";
import { H2, Large } from "@/components/ui/typography";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

export interface EmptyStatePage {
  title: string;
  description: string;
  cta?: {
    primary?: {
      text: string;
      link?: string;
      onClick?: boolean;
      showPlusIcon?: boolean;
    };
    secondary?: {
      text: string;
      link: string;
      openInNewTab?: boolean;
    };
  };
}

interface RequestsEmptyStateProps {
  isVisible: boolean;
  options: EmptyStatePage;
  onClickHandler?: () => void;
}

export default function RequestsEmptyState({
  isVisible,
  options,
  onClickHandler,
}: RequestsEmptyStateProps) {
  const navigate = useNavigate();
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

  const handlePrimaryAction = () => {
    if (options.cta?.primary?.onClick) {
      // The component using the empty state needs to handle the onClick via onClickHandler
      if (onClickHandler) {
        onClickHandler();
      }
      return;
    }

    if (options.cta?.primary?.link) {
      navigate(options.cta.primary.link);
      return;
    }

    // Default fallback to onboarding flow
    const currentStep = onboardingState?.currentStep || "ORGANIZATION";
    if (currentStep === "EVENT") {
      navigate("/onboarding/integrate");
    } else {
      navigate(STEP_ROUTES[currentStep]);
    }
  };

  const handleSecondaryAction = () => {
    const secondaryCta = options.cta?.secondary;
    if (!secondaryCta) return;

    const link = secondaryCta.link;

    if (link === "#tryDemo") {
      handleDemoClick();
      return;
    }

    if (secondaryCta.openInNewTab) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    if (link) {
      navigate(link);
    }
  };

  // Position factor: increase for lower position, decrease for higher position
  const positionFactor = 65;

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 pointer-events-none"
      style={{ top: "60px" }}
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
        className="absolute left-0 right-0 pointer-events-auto dark:hidden"
        style={{
          top: `${positionFactor}%`,
          height: `${100 - positionFactor}%`,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 8%, white 15%)",
        }}
      >
        {/* Content container - centered vertically and horizontally */}
        <div className="relative w-full h-full flex flex-col justify-center">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
            {/* Sidebar offset container - no transform on small screens, offset on medium+ */}
            <div className="w-full max-w-3xl flex flex-col gap-6 items-center md:translate-x-[calc(var(--sidebar-width,0px)/2)]">
              <div className="flex flex-col gap-2 text-center w-full">
                <H2>{options.title}</H2>
                <Large className="max-w-lg lg:max-w-3xl mx-auto">
                  {options.description}
                </Large>
              </div>

              <div className="flex gap-4 justify-center">
                {options.cta?.secondary && (
                  <Button variant="outline" onClick={handleSecondaryAction}>
                    {options.cta.secondary.text}
                  </Button>
                )}
                {options.cta?.primary && (
                  <Button variant="action" onClick={handlePrimaryAction}>
                    {options.cta.primary.text}
                    {!options.cta.primary.showPlusIcon && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Container with gradient top - Dark Mode */}
      <div
        className="absolute left-0 right-0 pointer-events-auto hidden dark:block"
        style={{
          top: `${positionFactor}%`,
          height: `${100 - positionFactor}%`,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.95) 8%, rgb(0,0,0) 15%)",
        }}
      >
        {/* Content container - centered vertically and horizontally */}
        <div className="relative w-full h-full flex flex-col justify-center">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
            {/* Sidebar offset container - no transform on small screens, offset on medium+ */}
            <div className="w-full max-w-3xl flex flex-col gap-6 items-center md:translate-x-[calc(var(--sidebar-width,0px)/2)]">
              <div className="flex flex-col gap-2 text-center w-full">
                <H2>{options.title}</H2>
                <Large className="max-w-lg lg:max-w-3xl mx-auto">
                  {options.description}
                </Large>
              </div>

              <div className="flex gap-4 justify-center">
                {options.cta?.secondary && (
                  <Button variant="outline" onClick={handleSecondaryAction}>
                    {options.cta.secondary.text}
                  </Button>
                )}
                {options.cta?.primary && (
                  <Button variant="action" onClick={handlePrimaryAction}>
                    {options.cta.primary.text}
                    {!options.cta.primary.showPlusIcon && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Define and export the combined options interface here
export interface RequestsPageEmptyStateOptions {
  options: EmptyStatePage;
  onPrimaryActionClick?: () => void;
  isVisible?: boolean;
}

export const EMPTY_STATE_PAGES: Record<string, EmptyStatePage> = {
  requests: {
    title: "Integrate to see your requests",
    description:
      "This is a preview. Integrate your LLM app with Helicone to see your actual requests.",
    cta: {
      primary: {
        text: "Quick Start",
        link: "/onboarding/integrate",
      },
      secondary: {
        text: "Try Demo",
        link: "#tryDemo",
      },
    },
  },
  "rate-limits": {
    title: "Configure Rate Limits",
    description:
      "Protect your LLM applications by setting up rate limits. Configure via the UI or directly in your code.",
    cta: {
      primary: {
        text: "Configure Rate Limits",
        onClick: true,
      },
      secondary: {
        text: "View Docs",
        link: "https://docs.helicone.ai/features/advanced-usage/custom-rate-limits",
        openInNewTab: true,
      },
    },
  },
};
