import { useRouter } from "next/router";
import { H1, P } from "../../ui/typography";
import { useOrg } from "../../layout/org/organizationContext";
import { useOrgOnboarding } from "../../../services/hooks/useOrgOnboarding";

const QuickstartPage = () => {
  const router = useRouter();
  const org = useOrg();
  const { hasKeys, hasProviderKeys, updateOnboardingStatus } = useOrgOnboarding(org?.currentOrg?.id ?? "");

  const steps = [
    {
      title: "Add provider key",
      description: "Add your LLM provider API key to start monitoring requests",
      onClick: () => router.push("/providers"),
    },
    {
      title: "Create Helicone API key",
      description: "Generate your Helicone API key to authenticate requests",
      onClick: () => router.push("/settings/api-keys"),
    },
    {
      title: "Integrate",
      description: "Connect your application to start logging requests",
      onClick: () => {
        // Placeholder for step 3
        console.log("Step 3 clicked - integrate");
      },
    },
  ];

  const allStepsCompleted = hasProviderKeys && hasKeys && org?.currentOrg?.has_integrated;

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="mx-auto max-w-2xl text-center mt-4">
        <H1>Quickstart</H1>
        <P className="text-muted-foreground">
          Get started with Helicone in 3 simple steps
        </P>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {steps.map((step, index) => {
          const isCompleted = 
            (index === 0 && hasProviderKeys) ||
            (index === 1 && hasKeys) ||
            (index === 2 && org?.currentOrg?.has_integrated);
          
          return (
            <div
              key={index}
              onClick={step.onClick}
              className={`cursor-pointer rounded-lg border border-border p-6 transition-colors duration-150 ${
                isCompleted 
                  ? 'bg-background hover:bg-background' 
                  : 'bg-card hover:bg-muted/50'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                  isCompleted 
                    ? 'bg-muted text-muted-foreground' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {index + 1}
                </div>
                <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                  {step.title}
                </h3>
              </div>
              <P className={`text-muted-foreground ${isCompleted ? 'line-through' : ''}`}>
                {step.description}
              </P>
            </div>
          );
        })}

        {allStepsCompleted && (
          <div
            onClick={async () => {
              await updateOnboardingStatus({ hasCompletedQuickstart: true });
              router.push("/dashboard");
            }}
            className="cursor-pointer rounded-lg border border-border py-1 transition-colors duration-150 bg-primary hover:bg-primary/90"
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