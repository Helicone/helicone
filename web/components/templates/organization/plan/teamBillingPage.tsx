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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CheckIcon } from "lucide-react";
import { PlanFeatureCard } from "./PlanFeatureCard";
import { InfoBox } from "@/components/ui/helicone/infoBox";

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
 * - $6/GB storage billing
 * - Everything included (prompts, experiments, evals)
 */
export const TeamPlanCard = () => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
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

          <div className="grid grid-cols-2 gap-2">
            {[
              "Unlimited seats, 5 organizations",
              "Everything in Pro",
              "SOC-2 & HIPAA compliance",
              "Dedicated Slack channel",
              "Support engineer & SLAs",
              "Data export",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-2 text-sm">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
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

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-md">
          <DialogHeader>
            <DialogTitle>Confirm Subscription Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to modify your Team subscription?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {}}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
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
          <CardDescription>$200/month + usage-based request billing</CardDescription>
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

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-md">
          <DialogHeader>
            <DialogTitle>Confirm Subscription Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to modify your Team subscription?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {}}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
