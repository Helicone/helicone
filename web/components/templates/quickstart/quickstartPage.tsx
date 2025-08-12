import { useRouter } from "next/router";
import { H2, P } from "../../ui/typography";
import { useOrg } from "../../layout/org/organizationContext";
import { useOrgOnboarding } from "../../../services/hooks/useOrgOnboarding";
import { QuickstartStepCard } from "../../onboarding/QuickstartStep";
import IntegrationGuide from "./integrationGuide";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../ui/dropdown-menu";
import { Button } from "../../ui/button";
import {
  ChevronDown,
  BookOpen,
  MessageSquare,
  Mail,
  MoveUpRight,
} from "lucide-react";
import Link from "next/link";

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

                  <Link
                    // TODO: Swap for AI Gateway documentation
                    href="https://docs.helicone.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-fit"
                  >
                    <Button variant="link" className="flex items-center gap-1">
                      View Docs
                      <MoveUpRight size={12} />
                    </Button>
                  </Link>
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

        <div className="flex flex-col gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="link" className="group w-fit">
                Need some help?
                <ChevronDown
                  size={16}
                  className="ml-2 transition-transform group-data-[state=open]:rotate-180"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link
                  href="https://docs.helicone.ai"
                  target="_blank"
                  className="flex items-center"
                >
                  <BookOpen size={16} className="mr-2" />
                  Documentation
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="https://discord.com/invite/2TkeWdXNPQ"
                  target="_blank"
                  className="flex items-center"
                >
                  <MessageSquare size={16} className="mr-2" />
                  Ask us on Discord
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/contact"
                  className="flex items-center"
                  target="_blank"
                >
                  <Mail size={16} className="mr-2" />
                  Contact Us
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default QuickstartPage;
