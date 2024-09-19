import { Col } from "@/components/layout/common";
import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { PlanFeatureCard } from "./PlanFeatureCard";
import { InfoBox } from "@/components/ui/helicone/infoBox";

export const MigrateGrowthToPro = () => {
  const org = useOrg();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
  });

  const upgradeExistingCustomerToPro = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST("/v1/stripe/subscription/migrate-to-pro");
      return result;
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/cancel-subscription"
      );
      return result;
    },
  });

  const handleUpgrade = async () => {
    const result = await upgradeExistingCustomerToPro.mutateAsync();
    setIsUpgradeDialogOpen(false);
    subscription.refetch();
    window.location.reload();
  };

  const handleCancel = async () => {
    await cancelSubscription.mutateAsync();
    setIsCancelDialogOpen(false);
    subscription.refetch();
  };

  const isSubscriptionEnding = subscription.data?.data?.cancel_at_period_end;

  const getBillingCycleDates = () => {
    if (
      subscription.data?.data?.current_period_start &&
      subscription.data?.data?.current_period_end
    ) {
      const startDate = new Date(
        subscription.data.data.current_period_start * 1000
      );
      const endDate = new Date(
        subscription.data.data.current_period_end * 1000
      );
      return `Next billing period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    return "N/A";
  };

  return (
    <div className="flex gap-6 lg:flex-row flex-col">
      <Card className="max-w-3xl w-full h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-end">
            Growth{" "}
            <span className="text-sm px-2 py-1 rounded-md ml-2 font-light border border-slate-200">
              Deprecating soon
            </span>
          </CardTitle>
          <CardDescription>
            We are discontinuing the Growth plan soon. Please{" "}
            <b>upgrade to Pro</b> to keep 100k requests every month and access
            all features or downgrade to Free plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <InfoBox icon={() => <></>} variant="warning">
            <p>Growth plan will be discontinued on October 15th, 2024</p>
          </InfoBox>
          <div className="text-xs text-muted-foreground flex items-center text-slate-500">
            <CalendarIcon className="w-4 h-4 mr-1" />
            {getBillingCycleDates()}
          </div>
          <Col className="gap-2">
            <Button
              onClick={() => setIsUpgradeDialogOpen(true)}
              disabled={upgradeExistingCustomerToPro.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {upgradeExistingCustomerToPro.isLoading
                ? "Upgrading..."
                : "Upgrade to Pro"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(true)}
              disabled={cancelSubscription.isLoading || isSubscriptionEnding}
            >
              {cancelSubscription.isLoading
                ? "Cancelling..."
                : "Cancel Subscription"}
            </Button>
            {isSubscriptionEnding && (
              <p className="text-sm text-gray-500 mt-1">
                Your subscription is already set to cancel at the end of the
                current billing period.
              </p>
            )}
            <Link
              href="/settings/billing-old"
              className="text-sm text-gray-500 underline"
            >
              View old billing page
            </Link>
            <Link
              href="https://helicone.ai/pricing"
              className="text-sm text-gray-500 underline"
            >
              View pricing page
            </Link>
          </Col>
        </CardContent>
      </Card>

      <div className="space-y-6 w-full lg:w-[450px]">
        <PlanFeatureCard
          title="Learn about our Enterprise plan"
          description="Built for companies looking to scale. Includes everything in Pro, plus unlimited requests, prompts, experiments and more."
          buttonText="Contact sales"
        />

        <PlanFeatureCard
          title="Looking for something else?"
          description="Need support, have a unique use case or want to say hi?"
          buttonText="Contact us"
        />
      </div>

      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upgrade to Pro Plan</DialogTitle>
            <DialogDescription>
              You are about to upgrade to the Pro plan. This will give you
              access to all Pro features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpgradeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpgrade}>Confirm Upgrade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You will lose
              access to all Growth plan features at the end of your current
              billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Go Back
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
