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
import { CalendarIcon } from "lucide-react";
import { PlanFeatureCard } from "./PlanFeatureCard";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { useCallback } from "react";
import {
  useCostForEvals,
  useCostForExperiments,
  useCostForPrompts,
} from "../../pricing/hooks";

export const ProPlanCard = () => {
  const org = useOrg();
  const [isPromptsDialogOpen, setIsPromptsDialogOpen] = useState(false);
  const [isEvalsDialogOpen, setIsEvalsDialogOpen] = useState(false);
  const [isExperimentsDialogOpen, setIsExperimentsDialogOpen] = useState(false);
  const costForPrompts = useCostForPrompts();
  const costForEvals = useCostForEvals();
  const costForExperiments = useCostForExperiments();

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
    mutationFn: async (
      productType: "alerts" | "prompts" | "evals" | "experiments"
    ) => {
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
    mutationFn: async (
      productType: "alerts" | "prompts" | "evals" | "experiments"
    ) => {
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

  const hasPrompts = subscription.data?.data?.items?.some(
    (item: any) => item.price.product?.name === "Prompts" && item.quantity > 0
  );

  const hasExperiments = subscription.data?.data?.items?.some(
    (item: any) =>
      item.price.product?.name === "Experiments" && item.quantity > 0
  );

  const hasEvals = subscription.data?.data?.items?.some(
    (item: any) => item.price.product?.name === "Evals" && item.quantity > 0
  );

  const handlePromptsToggle = () => {
    setIsPromptsDialogOpen(true);
  };

  const handleEvalsToggle = () => {
    setIsEvalsDialogOpen(true);
  };

  const handleExperimentsToggle = () => {
    setIsExperimentsDialogOpen(true);
  };

  const confirmPromptsChange = async () => {
    if (!hasPrompts) {
      await addProductToSubscription.mutateAsync("prompts");
    } else {
      await deleteProductFromSubscription.mutateAsync("prompts");
    }
    setIsPromptsDialogOpen(false);

    subscription.refetch();
  };

  const confirmEvalsChange = async () => {
    if (!hasEvals) {
      await addProductToSubscription.mutateAsync("evals");
    } else {
      await deleteProductFromSubscription.mutateAsync("evals");
    }
    setIsEvalsDialogOpen(false);
    subscription.refetch();
  };

  const confirmExperimentsChange = async () => {
    if (!hasExperiments) {
      await addProductToSubscription.mutateAsync("experiments");
    } else {
      await deleteProductFromSubscription.mutateAsync("experiments");
    }
    setIsExperimentsDialogOpen(false);
    subscription.refetch();
  };

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
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    return "N/A";
  };

  const getDialogDescription = useCallback(
    (isEnabling: boolean, feature: string, price: string) => {
      let description = isEnabling
        ? `You are about to enable ${feature}. This will add ${price}/mo to your subscription.`
        : `You are about to disable ${feature}. This will remove ${price}/mo from your subscription.`;

      if (isTrialActive && isEnabling) {
        description +=
          " You will not be charged for this feature while on your trial.";
      }

      return description;
    },
    [isTrialActive]
  );

  return (
    <div className="flex gap-6 lg:flex-row flex-col">
      <Card className="max-w-3xl w-full h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-end">
            Pro{" "}
            <span className="text-sm bg-[#DBE9FE] text-blue-700 px-2 py-1 rounded-md ml-2 font-medium">
              Current plan
            </span>
          </CardTitle>
          <CardDescription>
            Here&apos;s a summary of your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isTrialActive && (
            <InfoBox icon={() => <></>}>
              <p>
                Your trial ends on:{" "}
                {new Date(
                  subscription.data!.data!.trial_end! * 1000
                ).toLocaleDateString()}
              </p>
            </InfoBox>
          )}
          {subscription.data?.data?.current_period_start &&
            subscription.data?.data?.current_period_end && (
              <div className="text-sm text-gray-500">
                <p>Current billing period: {getBillingCycleDates()}</p>
                {isSubscriptionEnding && (
                  <p className="text-red-500 font-semibold mt-1">
                    Subscription ends{" "}
                    {new Date(
                      subscription.data.data.current_period_end * 1000
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          <Col className="gap-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompts-toggle">
                  Prompts (${costForPrompts.data?.data ?? "loading..."}/mo)
                </Label>
                <Switch
                  id="prompts-toggle"
                  checked={hasPrompts}
                  onCheckedChange={handlePromptsToggle}
                />
              </div>
              {isTrialActive && (
                <span className="text-xs text-muted-foreground mt-1 text-slate-500">
                  Included in trial (enable to start using)
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <Label htmlFor="evals-toggle">
                  Evals (${costForEvals.data?.data ?? "loading..."}/mo)
                </Label>
                <Switch
                  id="evals-toggle"
                  checked={hasEvals}
                  onCheckedChange={handleEvalsToggle}
                />
              </div>
              {isTrialActive && (
                <span className="text-xs text-muted-foreground mt-1 text-slate-500">
                  Included in trial (enable to start using)
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <Label htmlFor="experiments-toggle">
                  Experiments (${costForExperiments.data?.data ?? "loading..."}
                  /mo)
                </Label>
                <Switch
                  id="experiments-toggle"
                  checked={hasExperiments}
                  onCheckedChange={handleExperimentsToggle}
                />
              </div>
              {isTrialActive && (
                <span className="text-xs text-muted-foreground mt-1 text-slate-500">
                  Included in trial (enable to start using)
                </span>
              )}
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

      <Dialog open={isPromptsDialogOpen} onOpenChange={setIsPromptsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {!hasPrompts ? "Enable Prompts" : "Disable Prompts"}
            </DialogTitle>
            <DialogDescription>
              {getDialogDescription(
                !hasPrompts,
                "Prompts",
                `$${costForPrompts.data?.data ?? "loading..."}`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPromptsDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmPromptsChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEvalsDialogOpen} onOpenChange={setIsEvalsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {!hasEvals ? "Enable Evals" : "Disable Evals"}
            </DialogTitle>
            <DialogDescription>
              {getDialogDescription(
                !hasEvals,
                "Evals",
                `$${costForEvals.data?.data ?? "loading..."}`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEvalsDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmEvalsChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isExperimentsDialogOpen}
        onOpenChange={setIsExperimentsDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {!hasExperiments ? "Enable Experiments" : "Disable Experiments"}
            </DialogTitle>
            <DialogDescription>
              {getDialogDescription(
                !hasExperiments,
                "Experiments",
                `$${costForExperiments.data?.data ?? "loading..."}`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsExperimentsDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmExperimentsChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
