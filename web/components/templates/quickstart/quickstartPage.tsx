import { useRouter } from "next/router";
import { H2, P } from "../../ui/typography";
import { useOrg } from "../../layout/org/organizationContext";
import { useOrgOnboarding } from "../../../services/hooks/useOrgOnboarding";
import { QuickstartStepCard } from "../../onboarding/QuickstartStep";
import IntegrationGuide from "./integrationGuide";

const QuickstartPage = () => {
  const router = useRouter();
  const org = useOrg();
  const { hasKeys, hasProviderKeys, updateOnboardingStatus } = useOrgOnboarding(
    org?.currentOrg?.id ?? "",
  );

  const steps = [
    {
      title: "Add provider key",
      description: "Add key",
      link: "/settings/providers",
    },
    {
      title: "Create Helicone API key",
      description: "Create key",
      link: "/settings/api-keys",
    },
    {
      title: "Integrate",
      description: "Gateway dashboard",
      link: "/settings/ai-gateway",
    },
  ];

  const allStepsCompleted =
    hasProviderKeys && hasKeys && org?.currentOrg?.has_integrated;

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="mx-auto mt-4 w-full max-w-4xl items-start">
        <H2>Quickstart</H2>
        <P className="mt-2 text-sm text-muted-foreground">
          Get started with Helicone in 3 simple steps
        </P>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        {steps.map((step, index) => {
          const isCompleted =
            (index === 0 && hasProviderKeys) ||
            (index === 1 && hasKeys) ||
            (index === 2 && org?.currentOrg?.has_integrated);

          return (
            <QuickstartStepCard
              key={index}
              stepNumber={index + 1}
              title={step.title}
              isCompleted={isCompleted ?? false}
              link={step.link}
              rightContent={step.description}
            >
              {index === 2 && (
                <div className="mt-1">
                  <IntegrationGuide />
                </div>
              )}
            </QuickstartStepCard>
          );
        })}

        {allStepsCompleted && (
          <div
            onClick={async () => {
              await updateOnboardingStatus({ hasCompletedQuickstart: true });
              router.push("/dashboard");
            }}
            className="cursor-pointer rounded-lg border border-border bg-primary py-1 transition-colors duration-150 hover:bg-primary/90"
          >
            <div className="flex items-center justify-center">
              <h3 className="text-lg font-semibold text-primary-foreground">
                Finished!
              </h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickstartPage;
