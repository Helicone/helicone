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

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Growth Plan</CardTitle>
          <CardDescription>
            Your Growth plan is being discontinued. Please choose to upgrade to
            Pro or cancel your subscription.{" "}
            <Link
              href="/settings/billing-old"
              className="text-sky-500 hover:underline"
            >
              View old billing page
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Col className="gap-6">
            {subscription.data?.data?.current_period_end && (
              <div className="text-sm text-gray-500">
                Your Growth plan will end on:{" "}
                {new Date(
                  subscription.data.data.current_period_end * 1000
                ).toLocaleDateString()}
              </div>
            )}
            <Col className="gap-2">
              <Button
                onClick={() => setIsUpgradeDialogOpen(true)}
                disabled={upgradeExistingCustomerToPro.isLoading}
              >
                {upgradeExistingCustomerToPro.isLoading
                  ? "Upgrading..."
                  : "Upgrade to Pro"}
              </Button>
              <div>
                <Button
                  variant="destructive"
                  onClick={() => setIsCancelDialogOpen(true)}
                  disabled={
                    cancelSubscription.isLoading || isSubscriptionEnding
                  }
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
              </div>
              <Link
                href="https://helicone.ai/pricing"
                className="text-sm text-gray-500 underline"
              >
                View pricing page
              </Link>
            </Col>
          </Col>
        </CardContent>
      </Card>

      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent>
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
        <DialogContent>
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
