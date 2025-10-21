import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { H2, H3, P } from "../../ui/typography";
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
  CreditCard,
  DollarSign,
  Zap,
  Key,
  Send,
  ExternalLink,
  BarChart,
  ListTreeIcon,
  UserPlus,
  ArrowRight,
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
import PaymentModal from "../settings/PaymentModal";
import HelixIntegrationDialog from "./HelixIntegrationDialog";
import { useHeliconeAgent } from "../agent/HeliconeAgentContext";
import { useCredits } from "@/services/hooks/useCredits";
import { getJawnClient } from "@/lib/clients/jawn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHelixDialogOpen, setIsHelixDialogOpen] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testRequestId, setTestRequestId] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const { hasKeys, hasProviderKeys, updateOnboardingStatus } = useOrgOnboarding(
    org?.currentOrg?.id ?? "",
  );

  const { data: creditData, isLoading: creditsLoading } = useCredits();
  const hasCredits = (creditData?.balance ?? 0) > 0;
  const hasBillingSetup = hasCredits || hasProviderKeys;

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

  const handleSendTestRequest = async () => {
    if (!quickstartKey) {
      setNotification("Please create an API key first", "error");
      return;
    }

    setIsTestLoading(true);
    setTestError(null);
    setTestResponse(null);
    setTestRequestId(null);

    try {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST("/v1/test/gateway-request", {
        body: {
          apiKey: quickstartKey,
        },
      });

      if (result.data?.success) {
        setTestResponse(result.data.response ?? "Success!");
        setTestRequestId(result.data.requestId ?? null);
        setNotification("Test request sent successfully!", "success");
      } else {
        setTestError(result.data?.error ?? "Request failed");
        setNotification(result.data?.error ?? "Request failed", "error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setTestError(errorMessage);
      setNotification(errorMessage, "error");
    } finally {
      setIsTestLoading(false);
    }
  };

  const steps = [
    {
      title: "Set up billing",
      description: "",
      link: "",
    },
    {
      title: "Create Helicone API key",
      description: "Create key",
      link: "/settings/api-keys",
    },
    {
      title: "Integrate",
      description: "", // TODO Add back once gateway route is fixed
      link: "",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col gap-8 p-6">
      <div className="mx-auto mt-4 w-full max-w-4xl items-start">
        <H2>Quickstart</H2>
        <P className="mt-2 text-sm text-muted-foreground">
          Get started with Helicone in 3 simple steps
        </P>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {steps.map((step, index) => {
          const isCompleted =
            (index === 0 && hasBillingSetup) ||
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
              rightComponent={
                index === 0 ? (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <a
                      href="/credits"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Add credits</span>
                      <MoveUpRight size={12} />
                    </a>
                    <a
                      href="/settings/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Configure keys</span>
                      <MoveUpRight size={12} />
                    </a>
                  </div>
                ) : undefined
              }
              headerAction={
                index === 2 ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendTestRequest();
                            }}
                            disabled={!quickstartKey || isTestLoading}
                          >
                            {isTestLoading ? (
                              <>
                                <Loader size={14} className="mr-1 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send size={14} className="mr-1" />
                                Send Test Request
                              </>
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!quickstartKey && (
                        <TooltipContent>
                          <p>Create API key first</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ) : undefined
              }
            >
              {index === 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  {/* PTB Option */}
                  <div
                    className={`flex items-start justify-between gap-3 rounded-lg border-2 p-4 ${
                      hasCredits
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <CreditCard size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            Pass-Through Billing
                          </span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Simple pay-as-you-go pricing
                        </p>
                      </div>
                      {hasCredits && (
                        <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 dark:bg-green-900">
                          <Zap size={12} className="text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            ${(creditData?.balance ?? 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="action"
                      size="sm"
                      onClick={() => setIsPaymentModalOpen(true)}
                    >
                      {hasCredits ? "Add More" : "Add Credits"}
                    </Button>
                  </div>

                  {/* BYOK Option */}
                  <div
                    className="flex items-start justify-between gap-3 rounded-lg border-2 border-muted-foreground/20 bg-muted p-4"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                        <Key size={20} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold">
                          Bring Your Own Keys (BYOK)
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Use your existing provider accounts
                        </p>
                      </div>
                      {hasProviderKeys && (
                        <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 dark:bg-green-900">
                          <Zap size={12} className="text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            Configured
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsProviderSheetOpen(true)}
                    >
                      {hasProviderKeys ? "Manage Keys" : "Configure Keys"}
                    </Button>
                  </div>
                </div>
              )}
              {index === 1 && (
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
              {index === 2 && (
                <div className="mt-1">
                  <IntegrationGuide apiKey={quickstartKey} />

                  <div className="mx-4 mb-2 flex flex-col gap-2">
                    {/* Test Response Display */}
                    {testResponse && (
                      <div className="rounded-sm border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <Check size={16} className="mt-0.5 text-green-600 dark:text-green-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                Response:
                              </p>
                              <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                                {testResponse}
                              </p>
                            </div>
                          </div>
                          {testRequestId && (
                            <Link
                              href={`/requests?requestId=${testRequestId}`}
                              className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
                            >
                              <ExternalLink size={12} />
                              <span>View in requests page</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Test Error Display */}
                    {testError && (
                      <div className="rounded-sm border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 text-sm text-red-600 dark:text-red-400">✗</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                              Error:
                            </p>
                            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                              {testError}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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

                  {/* Help Section */}
                  <div className="mx-4 mt-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="link" className="group w-fit p-0">
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
              )}
            </QuickstartStepCard>
          );
        })}

        {/* Next Steps Section */}
        <div className="mt-8 flex flex-col gap-4">
          <H3>Next Steps</H3>
          <P className="text-sm text-muted-foreground">
            Explore popular features to get the most out of Helicone
          </P>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Dashboard Card */}
            <Link href="/dashboard">
              <div className="group cursor-pointer rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:shadow-md">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BarChart size={20} className="text-primary" />
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h4 className="font-semibold">View Dashboard</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      See your request analytics and usage metrics
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Sessions Card */}
            <Link href="/sessions">
              <div className="group cursor-pointer rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:shadow-md">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <ListTreeIcon size={20} className="text-primary" />
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Setup Sessions</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track user conversations and interactions
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Invite Members Card */}
            <Link href="/settings/members">
              <div className="group cursor-pointer rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:shadow-md">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <UserPlus size={20} className="text-primary" />
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Invite Members</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Collaborate with your team members
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
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

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        returnUrl="/quickstart"
      />

      <HelixIntegrationDialog
        isOpen={isHelixDialogOpen}
        onClose={() => setIsHelixDialogOpen(false)}
        onSubmit={handleHelixSubmit}
      />
    </div>
  );
};

export default QuickstartPage;
