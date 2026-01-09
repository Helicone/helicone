import { Col } from "@/components/layout/common";
import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getJawnClient } from "@/lib/clients/jawn";
import { logger } from "@/lib/telemetry/logger";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { InvoiceSheet } from "./InvoiceSheet";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { BillingUsageChart } from "./BillingUsageChart";

/**
 * Shared hook for Pro subscription management
 */
const useProSubscription = () => {
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

  const getBillingCycleDates = () => {
    if (
      subscription.data?.data?.current_period_start &&
      subscription.data?.data?.current_period_end
    ) {
      const startDate = new Date(
        subscription.data.data.current_period_start * 1000,
      );
      const endDate = new Date(
        subscription.data.data.current_period_end * 1000,
      );
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    return "N/A";
  };

  return {
    subscription,
    manageSubscriptionPaymentLink,
    reactivateSubscription,
    isTrialActive,
    isSubscriptionEnding,
    getBillingCycleDates,
  };
};

/**
 * New Pro Plan Card for tier pro-20251210
 * - $79/mo flat
 * - Unlimited seats
 * - Tiered GB storage billing (starts at $3.25/GB)
 * - Tiered request billing (10K free, then tiered)
 * - Prompts included
 */
export const ProPlanCard = () => {
  const {
    subscription,
    manageSubscriptionPaymentLink,
    reactivateSubscription,
    isTrialActive,
    isSubscriptionEnding,
    getBillingCycleDates,
  } = useProSubscription();

  return (
    <div className="flex max-w-5xl flex-row gap-6 pb-8">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-medium">Pro</CardTitle>
            <Badge
              variant="secondary"
              className="bg-sky-50 text-sky-700 hover:bg-sky-50"
            >
              Current plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription.data?.data?.current_period_start &&
            subscription.data?.data?.current_period_end && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>Current billing period: {getBillingCycleDates()}</span>
              </div>
            )}
          {isTrialActive && (
            <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
              <p className="text-sm text-sky-700">
                Your trial ends on:{" "}
                {new Date(
                  subscription.data!.data!.trial_end! * 1000,
                ).toLocaleDateString()}
              </p>
            </div>
          )}

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
                className="w-full bg-sky-600 text-white hover:bg-sky-700"
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
              className="font-semibold mt-6 text-center text-sm text-sky-600 hover:text-sky-700"
            >
              View pricing page
            </Link>
          </Col>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-2xl font-semibold">
              Learn about our Enterprise plan
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Built for companies looking to scale. Includes everything in Pro,
              plus unlimited requests, prompts, experiments and more.
            </p>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Link href="/contact" className="w-full">
              <Button
                variant="outline"
                size="lg"
                className="w-full border border-input"
              >
                Contact sales
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-2xl font-semibold">
              Looking for something else?
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Need support, have a unique use case or want to say hi?
            </p>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Link href="/contact" className="w-full">
              <Button
                variant="outline"
                size="lg"
                className="w-full border border-input"
              >
                Contact us
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

/**
 * Legacy Pro Plan Card for tiers pro-20240913, pro-20250202
 * - $20/seat/mo
 * - Per-request billing
 * - Prompts as $50/mo add-on
 */
export const LegacyProPlanCard = () => {
  const org = useOrg();
  const {
    subscription,
    manageSubscriptionPaymentLink,
    reactivateSubscription,
    isTrialActive,
    isSubscriptionEnding,
    getBillingCycleDates,
  } = useProSubscription();

  const hasPromptsAddon =
    (org?.currentOrg?.stripe_metadata as { addons?: { prompts?: boolean } })
      ?.addons?.prompts ?? false;

  return (
    <div className="flex max-w-5xl flex-row gap-6 pb-8">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-medium">Pro</CardTitle>
            <Badge
              variant="secondary"
              className="bg-sky-50 text-sky-700 hover:bg-sky-50"
            >
              Current plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription.data?.data?.current_period_start &&
            subscription.data?.data?.current_period_end && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>Current billing period: {getBillingCycleDates()}</span>
              </div>
            )}
          {isTrialActive && (
            <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
              <p className="text-sm text-sky-700">
                Your trial ends on:{" "}
                {new Date(
                  subscription.data!.data!.trial_end! * 1000,
                ).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              $20/seat/month + usage-based request billing
            </p>

            {/* Add-ons Section */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">Active Add-ons</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${hasPromptsAddon ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <span className="text-sm">Prompts</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {hasPromptsAddon ? "$50/mo" : "Not active"}
                  </span>
                </div>
              </div>
              {hasPromptsAddon && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Manage your add-ons via the &quot;Manage Subscription&quot; button below
                </p>
              )}
            </div>

          </div>

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
                className="w-full bg-sky-600 text-white hover:bg-sky-700"
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
              className="font-semibold mt-6 text-center text-sm text-sky-600 hover:text-sky-700"
            >
              View pricing page
            </Link>
          </Col>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-2xl font-semibold">
              Upgrade to Team Bundle
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Unlimited seats, prompts, and experiments included. Plus SOC-2 &
              HIPAA compliance.
            </p>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Link href="/contact" className="w-full">
              <Button
                variant="outline"
                size="lg"
                className="w-full border border-input"
              >
                Contact sales
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-2xl font-semibold">
              Looking for something else?
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Need support, have a unique use case or want to say hi?
            </p>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Link href="/contact" className="w-full">
              <Button
                variant="outline"
                size="lg"
                className="w-full border border-input"
              >
                Contact us
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
