import { useRouter } from "next/router";
import { H1, P } from "../../ui/typography";
import { useOrg } from "../../layout/org/organizationContext";
import { useOrgOnboarding } from "../../../services/hooks/useOrgOnboarding";

const QuickstartPage = () => {
  const router = useRouter();
  const org = useOrg();
  const { hasKeys, hasProviderKeys } = useOrgOnboarding(org?.currentOrg?.id ?? "");

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
            (index === 0 && hasProviderKeys) || // Step 1 (Add provider key) is completed if hasProviderKeys
            (index === 1 && hasKeys); // Step 2 (Create Helicone API key) is completed if hasKeys
          
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
      </div>
    </div>
  );
};

export default QuickstartPage;