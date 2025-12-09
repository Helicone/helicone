"use client";
import { useOrg } from "@/components/layout/org/organizationContext";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { H1, Muted, Small } from "@/components/ui/typography";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { CreditCard, Key, ArrowRight, DollarSign, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import PaymentModal from "@/components/templates/settings/PaymentModal";
import { useCredits } from "@/services/hooks/useCredits";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProviderKeySettings } from "@/components/templates/settings/providerKeySettings";

export default function BillingOnboardingPage() {
  const router = useRouter();
  const org = useOrg();
  const { setNotification } = useNotification();
  const { isLoading, updateCurrentStep, hasProviderKeys, refetchProviderKeys } =
    useOrgOnboarding(org?.currentOrg?.id ?? "");

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProviderSheetOpen, setIsProviderSheetOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"ptb" | "byok" | null>(
    null,
  );

  const { data: creditData, isLoading: creditsLoading } = useCredits();

  const hasCredits = useMemo(() => {
    return (creditData?.balance ?? 0) > 0;
  }, [creditData]);

  const hasBillingSetup = hasCredits || hasProviderKeys;

  useEffect(() => {
    updateCurrentStep("BILLING");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for provider keys since they might be added from settings page
  useEffect(() => {
    const interval = setInterval(() => {
      refetchProviderKeys();
    }, 2000);

    return () => clearInterval(interval);
  }, [refetchProviderKeys]);

  const handleContinue = async () => {
    if (!hasBillingSetup) {
      setNotification(
        "Please set up billing (add credits or configure provider keys) to continue",
        "error",
      );
      return;
    }

    updateCurrentStep("REQUEST");
    router.push("/onboarding/request");
  };

  const handleSelectPTB = () => {
    setSelectedMethod("ptb");
    setIsPaymentModalOpen(true);
  };

  if (isLoading || creditsLoading) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center">
        <OnboardingHeader />
        <div className="mx-auto mt-12 w-full max-w-2xl px-4">
          <div className="flex flex-col gap-4">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingHeader>
      <div className="mx-auto mt-12 w-full max-w-2xl px-4">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <H1>Set up billing</H1>
            <Muted>
              Choose how you&apos;d like to pay for AI model usage through
              Helicone.
            </Muted>
          </div>

          {/* Status Banner */}
          {hasBillingSetup && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <Small className="font-semibold text-green-900 dark:text-green-100">
                    Billing configured
                  </Small>
                  <Small className="text-green-700 dark:text-green-300">
                    {hasCredits &&
                      `You have $${(creditData?.balance ?? 0).toFixed(2)} in credits. `}
                    {hasProviderKeys && "You have provider keys configured. "}
                    You&apos;re ready to continue!
                  </Small>
                </div>
              </div>
            </div>
          )}

          {/* Billing Options */}
          <div className="flex flex-col gap-4">
            {/* Pass-Through Billing (PTB) Option */}
            <button
              onClick={handleSelectPTB}
              className={`relative flex flex-col gap-3 rounded-lg border-2 p-6 text-left transition-all ${
                selectedMethod === "ptb" || hasCredits
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Small className="font-semibold">
                        Pass-Through Billing
                      </Small>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Recommended
                      </span>
                    </div>
                    <Muted className="text-xs">
                      Simple pay-as-you-go pricing
                    </Muted>
                  </div>
                </div>
                {hasCredits && (
                  <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 dark:bg-green-900">
                    <Zap className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      ${(creditData?.balance ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="ml-13 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <Small className="text-muted-foreground">
                    No provider accounts needed
                  </Small>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <Small className="text-muted-foreground">
                    Consolidated billing across all providers
                  </Small>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <Small className="text-muted-foreground">
                    Transparent usage tracking
                  </Small>
                </div>
              </div>

              <div className="ml-13">
                <Button
                  variant="action"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPTB();
                  }}
                >
                  {hasCredits ? "Add More Credits" : "Add Credits"}
                </Button>
              </div>
            </button>

            {/* BYOK Option */}
            <div
              className={`relative flex flex-col gap-3 rounded-lg border-2 p-6 text-left transition-all ${
                selectedMethod === "byok" || hasProviderKeys
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Small className="font-semibold">
                      Bring Your Own Keys (BYOK)
                    </Small>
                    <Muted className="text-xs">
                      Use your existing provider accounts
                    </Muted>
                  </div>
                </div>
                {hasProviderKeys && (
                  <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 dark:bg-green-900">
                    <Zap className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      Configured
                    </span>
                  </div>
                )}
              </div>

              <div className="ml-13 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <Small className="text-muted-foreground">
                    Direct billing from providers
                  </Small>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <Small className="text-muted-foreground">
                    Use existing agreements and credits
                  </Small>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <Small className="text-muted-foreground">
                    Full control over API keys
                  </Small>
                </div>
              </div>

              <div className="ml-13">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProviderSheetOpen(true)}
                >
                  {hasProviderKeys
                    ? "Manage Provider Keys"
                    : "Configure Provider Keys"}
                </Button>
              </div>
            </div>
          </div>

          {/* Helper text */}
          <div className="rounded-lg bg-muted/50 p-4">
            <Small className="text-muted-foreground">
              💡 You can use both methods simultaneously. Credits will be used
              when no provider keys are configured, or when you explicitly
              request pass-through billing.
            </Small>
          </div>

          {/* Continue button */}
          <div className="flex justify-end">
            <Button
              variant="action"
              className="w-full sm:w-auto"
              onClick={handleContinue}
              disabled={!hasBillingSetup}
            >
              Continue to Test Request
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      {/* Provider Keys Sheet */}
      <Sheet open={isProviderSheetOpen} onOpenChange={setIsProviderSheetOpen}>
        <SheetContent side="right" size="large" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Configure Provider Keys</SheetTitle>
            <SheetDescription>
              Add your API keys for different LLM providers to use with Bring
              Your Own Keys (BYOK)
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProviderKeySettings />
          </div>
        </SheetContent>
      </Sheet>
    </OnboardingHeader>
  );
}
