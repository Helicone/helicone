import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { H2, P } from "../../ui/typography";
import { useOrg } from "../../layout/org/organizationContext";
import {
  OnboardingState,
  useOrgOnboarding,
} from "../../../services/hooks/useOrgOnboarding";
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
  Copy,
  Loader,
  Check,
  Bot,
  MoveUpRight,
} from "lucide-react";
import Link from "next/link";
import { useKeys } from "@/components/templates/keys/useKeys";
import { useLocalStorage } from "@/services/hooks/localStorage";
import useNotification from "@/components/shared/notification/useNotification";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";
import { ProviderKeySettings } from "../settings/providerKeySettings";
import HelixIntegrationDialog from "./HelixIntegrationDialog";
import { useHeliconeAgent } from "../agent/HeliconeAgentContext";

const QuickstartPage = () => {
  const router = useRouter();
  const org = useOrg();
  const { setNotification } = useNotification();
  const { addKey } = useKeys();
  const [quickstartKey, setQuickstartKey] = useLocalStorage<string | undefined>(
    `${org?.currentOrg?.id}_quickstartKey`,
    undefined,
  );
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isProviderSheetOpen, setIsProviderSheetOpen] = useState(false);
  const [isHelixDialogOpen, setIsHelixDialogOpen] = useState(false);

  const { hasKeys, hasProviderKeys, updateOnboardingStatus } = useOrgOnboarding(
    org?.currentOrg?.id ?? "",
  );

  const {
    setAgentChatOpen,
    setAgentState,
    setToolHandler,
    updateCurrentSessionMessages,
    messages,
  } = useHeliconeAgent();

  useEffect(() => {
    if (org?.currentOrg?.onboarding_status) {
      const hasCompletedQuickstart = (
        org?.currentOrg?.onboarding_status as unknown as OnboardingState
      ).hasCompletedQuickstart;
      if (hasCompletedQuickstart) {
        router.push("/dashboard");
      }
    }

    if (hasKeys === false) {
      setQuickstartKey(undefined);
    }
  }, [hasKeys]);

  useEffect(() => {
    setAgentChatOpen(true);
  }, []);

  useEffect(() => {
    setToolHandler("quickstart-open-integration-guide", async () => {
      setIsHelixDialogOpen(true);
      return {
        success: true,
        message: "Successfully opened the integration guide dialog",
      };
    });
  }, []);

  const handleCreateKey = async () => {
    try {
      let isEu = false;
      if (typeof window !== "undefined") {
        isEu = window.location.hostname.includes("eu.");
      }
      setIsCreatingKey(true);
      const { apiKey } = await addKey.mutateAsync({
        permission: "rw",
        keyName: "Quickstart",
        isEu,
      });
      if (apiKey) {
        setQuickstartKey(apiKey);
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleHelixSubmit = (message: string) => {
    const helpMessage = {
      role: "user" as const,
      content: message,
    };
    updateCurrentSessionMessages([...messages, helpMessage], true);
    setAgentChatOpen(true);

    setTimeout(() => {
      setAgentState((prev) => ({
        ...prev,
        needsAssistantResponse: true,
        isProcessing: true,
      }));
    }, 100);
  };

  const steps = [
    {
      title: "Create Helicone API key",
      description: "Create key",
      link: "/settings/api-keys",
    },
    {
      title: "Add provider key",
      description: "Add key",
      link: "/settings/providers",
    },
    {
      title: "Integrate",
      description: "", // TODO Add back once gateway route is fixed
      link: "",
    },
  ];

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
            (index === 0 && hasKeys) ||
            (index === 1 && hasProviderKeys) ||
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
              {index === 0 && (
                <div className="mt-4">
                  {quickstartKey ? (
                    <div className="rounded-sm border border-border bg-muted/30 p-2">
                      <div className="flex items-center gap-2">
                        <code className="font-mono flex-1 break-all rounded-sm px-2 py-1 text-sm">
                          {quickstartKey}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(quickstartKey);
                            setNotification("Copied to clipboard", "success");
                          }}
                          className="h-auto p-1"
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleCreateKey}
                        disabled={isCreatingKey}
                        className="w-fit"
                        variant="outline"
                      >
                        {isCreatingKey ? "Creating..." : "Create API Key"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {index === 1 && (
                <div className="mt-4">
                  <Button
                    onClick={() => setIsProviderSheetOpen(true)}
                    className="w-fit"
                    variant="outline"
                  >
                    Add Provider Key
                  </Button>
                </div>
              )}
              {index === 2 && (
                <div className="mt-1">
                  <IntegrationGuide apiKey={quickstartKey} />

                  <div className="mx-4 mb-2 flex flex-col gap-2">
                    <div
                      className={`rounded-sm border border-border p-3 ${org?.currentOrg?.has_integrated ? "bg-confirmative/10" : "bg-muted/30"}`}
                    >
                      <div className="flex items-center gap-2">
                        {org?.currentOrg?.has_integrated ? (
                          <Check size={16} className="text-confirmative" />
                        ) : (
                          <Loader
                            size={16}
                            className="animate-spin text-muted-foreground"
                          />
                        )}
                        <span
                          className={`text-sm ${org?.currentOrg?.has_integrated ? "text-confirmative" : "text-muted-foreground"}`}
                        >
                          {org?.currentOrg?.has_integrated
                            ? "Requests detected!"
                            : "Listening for requests..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="https://docs.helicone.ai/getting-started/quick-start"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="link"
                      className="flex w-auto items-center gap-1"
                    >
                      Using another SDK?
                      <MoveUpRight size={12} />
                    </Button>
                  </Link>
                </div>
              )}
            </QuickstartStepCard>
          );
        })}

        {org?.currentOrg?.has_integrated && (
          <div
            onClick={async () => {
              await updateOnboardingStatus({ hasCompletedQuickstart: true });
              setQuickstartKey(undefined);
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
                <button
                  onClick={() => setIsHelixDialogOpen(true)}
                  className="flex w-full items-center"
                >
                  <Bot size={16} className="mr-2" />
                  Ask Helix
                </button>
              </DropdownMenuItem>
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

      <Sheet open={isProviderSheetOpen} onOpenChange={setIsProviderSheetOpen}>
        <SheetContent side="right" size="large" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Provider Keys</SheetTitle>
            <SheetDescription>
              Configure your API keys for different LLM providers to start
              making requests.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProviderKeySettings />
          </div>
        </SheetContent>
      </Sheet>

      <HelixIntegrationDialog
        isOpen={isHelixDialogOpen}
        onClose={() => setIsHelixDialogOpen(false)}
        onSubmit={handleHelixSubmit}
      />
    </div>
  );
};

export default QuickstartPage;
