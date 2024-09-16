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
import { InvoiceSheet } from "./InvoiceSheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

export const ProPlanCard = () => {
  const org = useOrg();
  const [isAlertsDialogOpen, setIsAlertsDialogOpen] = useState(false);
  const [isPromptsDialogOpen, setIsPromptsDialogOpen] = useState(false);
  const [isEnablingAlerts, setIsEnablingAlerts] = useState(false);
  const [isEnablingPrompts, setIsEnablingPrompts] = useState(false);

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
        "/v1/stripe/subscription/manage-subscription"
      );
      return result;
    },
  });

  const reactivateSubscription = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/undo-cancel-subscription"
      );
      return result;
    },
  });

  const addProductToSubscription = useMutation({
    mutationFn: async (productType: "alerts" | "prompts") => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/add-ons/{productType}",
        {
          params: {
            path: {
              productType,
            },
          },
        }
      );
      return result;
    },
  });

  const deleteProductFromSubscription = useMutation({
    mutationFn: async (productType: "alerts" | "prompts") => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.DELETE(
        "/v1/stripe/subscription/add-ons/{productType}",
        {
          params: {
            path: {
              productType,
            },
          },
        }
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

  const hasAlerts = subscription.data?.data?.items.data.some(
    (item: any) => item.price.product?.name === "Alerts" && item.quantity > 0
  );
  const hasPrompts = subscription.data?.data?.items.data.some(
    (item: any) => item.price.product?.name === "Prompts" && item.quantity > 0
  );

  const handleAlertsToggle = () => {
    setIsEnablingAlerts(!hasAlerts);
    setIsAlertsDialogOpen(true);
  };

  const handlePromptsToggle = () => {
    setIsEnablingPrompts(!hasPrompts);
    setIsPromptsDialogOpen(true);
  };

  const confirmAlertsChange = async () => {
    if (isEnablingAlerts) {
      await addProductToSubscription.mutateAsync("alerts");
    } else {
      await deleteProductFromSubscription.mutateAsync("alerts");
    }
    setIsAlertsDialogOpen(false);
    subscription.refetch();
  };

  const confirmPromptsChange = async () => {
    if (isEnablingPrompts) {
      await addProductToSubscription.mutateAsync("prompts");
    } else {
      await deleteProductFromSubscription.mutateAsync("prompts");
    }
    setIsPromptsDialogOpen(false);
    subscription.refetch();
  };

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Pro Plan</CardTitle>
          <CardDescription>
            You are currently on the Pro plan. Here&apos;s a summary of your
            subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Col className="gap-6">
            {isTrialActive && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
                <p className="font-bold">Trial Active</p>
                <p>
                  Your trial ends on:{" "}
                  {new Date(
                    subscription.data!.data!.trial_end! * 1000
                  ).toLocaleDateString()}
                </p>
              </div>
            )}
            {subscription.data?.data?.current_period_start &&
              subscription.data?.data?.current_period_end && (
                <div className="text-sm text-gray-500">
                  <p>
                    Current billing period:{" "}
                    {new Date(
                      subscription.data.data.current_period_start * 1000
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(
                      subscription.data.data.current_period_end * 1000
                    ).toLocaleDateString()}
                  </p>
                  {isSubscriptionEnding && (
                    <p className="text-red-500 font-semibold mt-1">
                      Your subscription will end on:{" "}
                      {new Date(
                        subscription.data.data.current_period_end * 1000
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            <Col className="gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts-toggle">Alerts ($15/mo)</Label>
                <Switch
                  id="alerts-toggle"
                  checked={hasAlerts}
                  onCheckedChange={handleAlertsToggle}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="prompts-toggle">Prompts ($30/mo)</Label>
                <Switch
                  id="prompts-toggle"
                  checked={hasPrompts}
                  onCheckedChange={handlePromptsToggle}
                />
              </div>
            </Col>
            <Col className="gap-2">
              {isSubscriptionEnding ? (
                <Button
                  onClick={async () => {
                    const result = await reactivateSubscription.mutateAsync();
                    if (result.data) {
                      subscription.refetch();
                    } else {
                      console.error("Failed to reactivate subscription");
                    }
                  }}
                  disabled={reactivateSubscription.isLoading}
                >
                  {reactivateSubscription.isLoading
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
                      console.error(
                        "No URL returned from manage subscription mutation"
                      );
                    }
                  }}
                  disabled={manageSubscriptionPaymentLink.isLoading}
                >
                  {manageSubscriptionPaymentLink.isLoading
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
          </Col>
        </CardContent>
      </Card>

      <Dialog open={isAlertsDialogOpen} onOpenChange={setIsAlertsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEnablingAlerts ? "Enable Alerts" : "Disable Alerts"}
            </DialogTitle>
            <DialogDescription>
              {isEnablingAlerts
                ? "You are about to enable Alerts. This will add $15/mo to your subscription."
                : "You are about to disable Alerts. This will remove $15/mo from your subscription."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAlertsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmAlertsChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromptsDialogOpen} onOpenChange={setIsPromptsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEnablingPrompts ? "Enable Prompts" : "Disable Prompts"}
            </DialogTitle>
            <DialogDescription>
              {isEnablingPrompts
                ? "You are about to enable Prompts. This will add $30/mo to your subscription."
                : "You are about to disable Prompts. This will remove $30/mo from your subscription."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPromptsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmPromptsChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
