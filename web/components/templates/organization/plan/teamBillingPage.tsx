import { Col } from "@/components/layout/common";
import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getJawnClient } from "@/lib/clients/jawn";
import { logger } from "@/lib/telemetry/logger";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { InvoiceSheet } from "./InvoiceSheet";
import { CheckIcon, ArrowRight, Sparkles } from "lucide-react";
import { PlanFeatureCard } from "./PlanFeatureCard";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { BillingUsageChart } from "./BillingUsageChart";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Shared hook for Team subscription management
 */
const useTeamSubscription = () => {
  const org = useOrg();

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
  });

  const manageSubscriptionPaymentLink = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/manage-subscription",
      );
      return result;
    },
  });

  const reactivateSubscription = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/undo-cancel-subscription",
      );
      return result;
    },
  });

  const isTrialActive =
    subscription.data?.data?.trial_end &&
    new Date(subscription.data.data.trial_end * 1000) > new Date() &&
    (!subscription.data?.data?.current_period_start ||
      new Date(subscription.data.data.trial_end * 1000) >
        new Date(subscription.data.data.current_period_start * 1000));

  const isSubscriptionEnding = subscription.data?.data?.cancel_at_period_end;

  return {
    subscription,
    manageSubscriptionPaymentLink,
    reactivateSubscription,
    isTrialActive,
    isSubscriptionEnding,
  };
};

/**
 * New Team Plan Card for tier team-20251210
 * - $799/mo flat
 * - Unlimited seats, 5 organizations
 * - Tiered GB storage billing (starts at $3.25/GB)
 * - Tiered request billing (10K free, then tiered)
 * - Everything included (prompts, experiments, evals)
 */
export const TeamPlanCard = () => {
  const {
    subscription,
    manageSubscriptionPaymentLink,
    reactivateSubscription,
    isTrialActive,
    isSubscriptionEnding,
  } = useTeamSubscription();

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <Card className="h-fit w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-end text-lg font-medium">
            Team Bundle
            <span className="ml-2 rounded-md bg-[#DBE9FE] px-2 py-1 text-sm font-medium text-blue-700">
              Current plan
            </span>
          </CardTitle>
          <CardDescription>
            All features included in the Team plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isTrialActive && (
            <InfoBox icon={() => <></>}>
              <p>
                Your trial ends on:{" "}
                {new Date(
                  subscription.data!.data!.trial_end! * 1000,
                ).toLocaleDateString()}
              </p>
            </InfoBox>
          )}

          {subscription.data?.data?.current_period_start &&
            subscription.data?.data?.current_period_end && (
              <div className="text-sm text-gray-500">
                <p>
                  Current billing period:{" "}
                  {new Date(
                    subscription.data.data.current_period_start * 1000,
                  ).toLocaleDateString()}
                  {" - "}
                  {new Date(
                    subscription.data.data.current_period_end * 1000,
                  ).toLocaleDateString()}
                </p>
                {isSubscriptionEnding && (
                  <p className="mt-1 font-semibold text-red-500">
                    Subscription ends{" "}
                    {new Date(
                      subscription.data.data.current_period_end * 1000,
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 text-sm">
              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <span>
                Unlimited seats, 5 organizations (
                <a
                  href="mailto:support@helicone.ai"
                  className="text-sky-600 hover:underline"
                >
                  email us
                </a>{" "}
                for more)
              </span>
            </div>
            {[
              "Everything in Pro",
              "Dedicated Slack channel",
              "Support engineer & SLAs",
              "Data export",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-2 text-sm">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
            <div className="flex items-start gap-2 text-sm">
              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <a
                href="https://trust.helicone.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:underline"
              >
                SOC-2 & HIPAA compliance
              </a>
            </div>
          </div>

          {/* Usage Chart */}
          <BillingUsageChart />

          <Col className="gap-2">
            {isSubscriptionEnding ? (
              <Button
                onClick={async () => {
                  const result = await reactivateSubscription.mutateAsync();
                  if (result.data) {
                    subscription.refetch();
                  } else {
                    logger.error("Failed to reactivate subscription");
                  }
                }}
                disabled={reactivateSubscription.isPending}
              >
                {reactivateSubscription.isPending
                  ? "Reactivating..."
                  : "Reactivate Subscription"}
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  const result =
                    await manageSubscriptionPaymentLink.mutateAsync();
                  if (result.data) {
                    window.open(result.data, "_blank");
                  } else {
                    logger.error(
                      "No URL returned from manage subscription mutation",
                    );
                  }
                }}
                disabled={manageSubscriptionPaymentLink.isPending}
              >
                {manageSubscriptionPaymentLink.isPending
                  ? "Loading..."
                  : "Manage Subscription"}
              </Button>
            )}
            <InvoiceSheet />
            <Link
              href="https://helicone.ai/pricing"
              className="text-sm text-gray-500 underline"
            >
              View pricing page
            </Link>
          </Col>
        </CardContent>
      </Card>

      <div className="w-full space-y-6 lg:w-[450px]">
        <PlanFeatureCard
          title="Learn about our Enterprise plan"
          description="Built for companies looking to scale. Includes everything in Team, plus dedicated support and custom SLAs."
          buttonText="Contact sales"
          onButtonClick={() => {
            window.open("https://helicone.ai/contact", "_blank");
          }}
        />

        <PlanFeatureCard
          title="Need help with your Team plan?"
          description="Our support team is here to help with any questions about your subscription."
          buttonText="Contact support"
          onButtonClick={() => {
            window.open("https://helicone.ai/contact", "_blank");
          }}
        />
      </div>
    </div>
  );
};

/**
 * Legacy Team Plan Card for tier team-20250130
 * - $200/mo flat
 * - Unlimited seats
 * - Per-request billing
 */
export const LegacyTeamPlanCard = () => {
  const org = useOrg();
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const {
    subscription,
    manageSubscriptionPaymentLink,
    reactivateSubscription,
    isTrialActive,
    isSubscriptionEnding,
  } = useTeamSubscription();

  const migrateToNewPricing = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/migrate-to-new-team-pricing",
      );
      return result;
    },
    onSuccess: () => {
      // Refresh the page to show the new billing page
      window.location.reload();
    },
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <Card className="h-fit w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-end text-lg font-medium">
            Team Bundle
            <span className="ml-2 rounded-md bg-[#DBE9FE] px-2 py-1 text-sm font-medium text-blue-700">
              Current plan
            </span>
          </CardTitle>
          <CardDescription>
            $200/month + usage-based request billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isTrialActive && (
            <InfoBox icon={() => <></>}>
              <p>
                Your trial ends on:{" "}
                {new Date(
                  subscription.data!.data!.trial_end! * 1000,
                ).toLocaleDateString()}
              </p>
            </InfoBox>
          )}

          {subscription.data?.data?.current_period_start &&
            subscription.data?.data?.current_period_end && (
              <div className="text-sm text-gray-500">
                <p>
                  Current billing period:{" "}
                  {new Date(
                    subscription.data.data.current_period_start * 1000,
                  ).toLocaleDateString()}
                  {" - "}
                  {new Date(
                    subscription.data.data.current_period_end * 1000,
                  ).toLocaleDateString()}
                </p>
                {isSubscriptionEnding && (
                  <p className="mt-1 font-semibold text-red-500">
                    Subscription ends{" "}
                    {new Date(
                      subscription.data.data.current_period_end * 1000,
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

          <div className="grid grid-cols-2 gap-2">
            {[
              "Unlimited seats",
              "Everything in Pro",
              "Prompts included",
              "Experiments included",
              "SOC-2 & HIPAA compliance",
              "Data export",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-2 text-sm">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Migration Banner */}
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-sky-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-sky-900">
                  New Simplified Pricing Available
                </h3>
                <p className="mt-1 text-sm text-sky-700">
                  Upgrade to our new $799/month plan with usage-based storage billing
                  and all features included.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-sky-300 text-sky-700 hover:bg-sky-100"
                  onClick={() => setShowMigrationDialog(true)}
                  disabled={migrateToNewPricing.isPending}
                >
                  {migrateToNewPricing.isPending ? (
                    "Migrating..."
                  ) : (
                    <>
                      Migrate to New Pricing
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Migration Confirmation Dialog */}
          <AlertDialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Migrate to New Pricing</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    You&apos;re about to migrate from the legacy Team plan to our new simplified pricing:
                  </p>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <div className="font-medium mb-2">New Plan Benefits:</div>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li><strong>$799/month flat</strong> (previously $200/mo + per-request)</li>
                      <li>Usage-based storage billing (starts at $3.25/GB)</li>
                      <li>Tiered request pricing (10K free, then tiered rates)</li>
                      <li>All features included</li>
                    </ul>
                  </div>
                  <p className="text-muted-foreground">
                    Your subscription will be updated immediately with prorations applied
                    for the current billing period.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    try {
                      await migrateToNewPricing.mutateAsync();
                    } catch (error) {
                      logger.error(
                        { error: error instanceof Error ? error.message : String(error) },
                        "Failed to migrate to new pricing",
                      );
                    }
                  }}
                  disabled={migrateToNewPricing.isPending}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  {migrateToNewPricing.isPending ? "Migrating..." : "Confirm Migration"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Col className="gap-2">
            {isSubscriptionEnding ? (
              <Button
                onClick={async () => {
                  const result = await reactivateSubscription.mutateAsync();
                  if (result.data) {
                    subscription.refetch();
                  } else {
                    logger.error("Failed to reactivate subscription");
                  }
                }}
                disabled={reactivateSubscription.isPending}
              >
                {reactivateSubscription.isPending
                  ? "Reactivating..."
                  : "Reactivate Subscription"}
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  const result =
                    await manageSubscriptionPaymentLink.mutateAsync();
                  if (result.data) {
                    window.open(result.data, "_blank");
                  } else {
                    logger.error(
                      "No URL returned from manage subscription mutation",
                    );
                  }
                }}
                disabled={manageSubscriptionPaymentLink.isPending}
              >
                {manageSubscriptionPaymentLink.isPending
                  ? "Loading..."
                  : "Manage Subscription"}
              </Button>
            )}
            <InvoiceSheet />
            <Link
              href="https://helicone.ai/pricing"
              className="text-sm text-gray-500 underline"
            >
              View pricing page
            </Link>
          </Col>
        </CardContent>
      </Card>

      <div className="w-full space-y-6 lg:w-[450px]">
        <PlanFeatureCard
          title="Learn about our Enterprise plan"
          description="Built for companies looking to scale. Includes everything in Team, plus dedicated support and custom SLAs."
          buttonText="Contact sales"
          onButtonClick={() => {
            window.open("https://helicone.ai/contact", "_blank");
          }}
        />

        <PlanFeatureCard
          title="Need help with your Team plan?"
          description="Our support team is here to help with any questions about your subscription."
          buttonText="Contact support"
          onButtonClick={() => {
            window.open("https://helicone.ai/contact", "_blank");
          }}
        />
      </div>
    </div>
  );
};
