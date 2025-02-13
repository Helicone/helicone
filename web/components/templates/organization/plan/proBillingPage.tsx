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
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { InvoiceSheet } from "./InvoiceSheet";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useCallback } from "react";
import {
  useCostForEvals,
  useCostForExperiments,
  useCostForPrompts,
} from "../../pricing/hooks";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";

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
    <div className="flex flex-row gap-6 max-w-5xl pb-8">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground text-slate-500">
                <CalendarIcon className="h-4 w-4" />
                <span>Current billing period: {getBillingCycleDates()}</span>
              </div>
            )}
          {isTrialActive && (
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-4">
              <p className="text-sm text-sky-700">
                Your trial ends on:{" "}
                {new Date(
                  subscription.data!.data!.trial_end! * 1000
                ).toLocaleDateString()}
              </p>
            </div>
          )}
          {isTrialActive && (
            <div className="text-sm text-slate-500">
              All add-ons are free during your trial
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    Prompts{" "}
                    {isTrialActive ? (
                      <span className="text-slate-400 line-through">
                        ${costForPrompts.data?.data ?? "loading..."}/mo
                      </span>
                    ) : (
                      <span>
                        (${costForPrompts.data?.data ?? "loading..."}/mo)
                      </span>
                    )}
                  </h3>
                </div>
                {isTrialActive && (
                  <p className="text-sm text-slate-500">
                    Create, version and test prompts
                  </p>
                )}
              </div>
              <Switch
                checked={hasPrompts}
                onCheckedChange={handlePromptsToggle}
                className="data-[state=checked]:bg-sky-600"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    Evals{" "}
                    {isTrialActive ? (
                      <span className="text-slate-400 line-through">
                        ${costForEvals.data?.data ?? "loading..."}/mo
                      </span>
                    ) : (
                      <span>
                        (${costForEvals.data?.data ?? "loading..."}/mo)
                      </span>
                    )}
                  </h3>
                </div>
                {isTrialActive && (
                  <p className="text-sm text-slate-500">
                    Evaluate prompt performance
                  </p>
                )}
              </div>
              <Switch
                checked={hasEvals}
                onCheckedChange={handleEvalsToggle}
                className="data-[state=checked]:bg-sky-600"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    Experiments{" "}
                    {isTrialActive ? (
                      <span className="text-slate-400 line-through">
                        ${costForExperiments.data?.data ?? "loading..."}/mo
                      </span>
                    ) : (
                      <span>
                        (${costForExperiments.data?.data ?? "loading..."}/mo)
                      </span>
                    )}
                  </h3>
                </div>
                {isTrialActive && (
                  <p className="text-sm text-slate-500">
                    Run A/B tests on prompts
                  </p>
                )}
              </div>
              <Switch
                checked={hasExperiments}
                onCheckedChange={handleExperimentsToggle}
                className="data-[state=checked]:bg-sky-600"
              />
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
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
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
              className="mt-6 text-sm text-gray-500 text-semibold text-center text-sky-600 hover:text-sky-700"
            >
              View pricing page
            </Link>
          </Col>
        </CardContent>
      </Card>

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
