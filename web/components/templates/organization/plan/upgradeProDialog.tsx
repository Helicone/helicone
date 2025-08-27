"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Plus, Minus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureName } from "@/hooks/useProFeature";
import { useCostForPrompts } from "../../pricing/hooks";
import { P, Muted } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/helicone/infoBox";

export type Addons = {
  pro: boolean;
  prompts: boolean;
};

type AddonKey = "pro" | "prompts";

type PricingAddon = {
  key: AddonKey;
  name: string;
  price: number;
  description: string;
};

const TEAM_BUNDLE_PRICE = 200;

const FEATURE_MESSAGES: Record<string, string> = {
  time_filter: "Extended time filters require Pro plan.",
  users: "Track per-user metrics and usage patterns with Pro.",
  datasets: "Advanced dataset management requires Pro upgrade.",
  prompts: "Version and manage production prompts with Pro.",
  invite: "Team member management requires Pro subscription.",
  alerts: "Real-time alert configuration needs Pro plan.",
  ratelimit: "Custom rate limits by request count or cost with Pro.",
  sessions: "Track multi-step LLM interactions with Pro.",
  properties: "Add custom metadata tags for request analysis.",
  vault: "Secure secret management requires Pro plan.",
  webhooks: "Automate workflows with LLM event webhooks.",
  playground: "Prompt testing sandbox available in Pro.",
  evaluators: "LLM performance evaluation tools with Pro.",
  experiments: "A/B test prompts at scale with Pro.",
  default:
    "Choose the plan that best fits your team. All plans include a 7-day free trial.",
};

interface UpgradeProDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: FeatureName;
  limitMessage?: string;
}

export const UpgradeProDialog = ({
  open,
  onOpenChange,
  featureName,
  limitMessage,
}: UpgradeProDialogProps) => {
  const org = useOrg();
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "team">("pro");
  const [selectedAddons, setSelectedAddons] = useState<Addons>({
    pro: true,
    prompts: true,
  });
  const [seats, setSeats] = useState(1);
  const promptsPrice = useCostForPrompts();

  useEffect(() => {
    if (open && featureName) {
      const featureKey = featureName.toLowerCase() as keyof Addons;

      if (featureKey in selectedAddons) {
        setSelectedAddons((prev) => ({
          ...prev,
          [featureKey]: true,
        }));
      }
    }
  }, [open, featureName, selectedAddons]);

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
    enabled: !!org?.currentOrg?.id,
  });

  const upgradeToPro = useMutation({
    mutationFn: async (variables: { addons: Addons; seats?: number }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const endpoint =
        subscription.data?.data?.status === "canceled"
          ? "/v1/stripe/subscription/existing-customer/upgrade-to-pro"
          : "/v1/stripe/subscription/new-customer/upgrade-to-pro";
      const result = await jawn.POST(endpoint, {
        body: {
          addons: {
            prompts: variables.addons.prompts,
          },
          seats: variables.seats,
        },
      });
      return result;
    },
  });

  const upgradeToTeamBundle = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const endpoint =
        subscription.data?.data?.status === "canceled"
          ? "/v1/stripe/subscription/existing-customer/upgrade-to-team-bundle"
          : "/v1/stripe/subscription/new-customer/upgrade-to-team-bundle";
      const result = await jawn.POST(endpoint, {});
      return result;
    },
  });


  const handleSeatChange = (increment: number) => {
    setSeats((prev) => Math.max(1, prev + increment));
  };

  const ADDONS: PricingAddon[] = useMemo(
    () => [
      {
        key: "pro",
        name: "Pro Plan",
        price: 20,
        description:
          "No log limits, sessions, cache, user analytics, and more.",
      },
      {
        key: "prompts",
        name: "Prompts",
        price: promptsPrice.data?.data || 50,
        description: "Create, version and test prompts",
      },
    ],
    [promptsPrice.data],
  );

  const proAddon = ADDONS.find((a) => a.key === "pro")!;

  const proTotalPrice = useMemo(() => {
    const base = proAddon.price * seats;
    const promptsCost = selectedAddons.prompts ? (promptsPrice.data?.data || 50) : 0;
    return base + promptsCost;
  }, [seats, proAddon.price, selectedAddons.prompts, promptsPrice.data]);


  // Get description text with case insensitivity
  const descriptionText = featureName
    ? FEATURE_MESSAGES[featureName.toLowerCase()] || FEATURE_MESSAGES.default
    : FEATURE_MESSAGES.default;

  // Add a function to get the dialog header based on the limit info
  const getDialogHeader = () => {
    if (limitMessage) {
      return (
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-xl font-bold">
            Free Tier Limit Reached
          </DialogTitle>
          <InfoBox variant="warning" className="py-1 text-sm">
            {limitMessage}
          </InfoBox>
        </div>
      );
    }

    // Default case - standard upgrade header
    return (
      <DialogTitle className="text-xl font-bold text-foreground">
        Upgrade to Pro
      </DialogTitle>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>{getDialogHeader()}</DialogHeader>

        <DialogDescription className="text-sm">
          {descriptionText}
        </DialogDescription>

        <RadioGroup
          value={selectedPlan}
          onValueChange={(value) => setSelectedPlan(value as "pro" | "team")}
          className="flex flex-col gap-3"
        >
          {/* Pro Plan Option */}
          <label 
            htmlFor="pro"
            className={`relative flex flex-col gap-3 cursor-pointer rounded-lg border p-4 transition-colors ${
              selectedPlan === "pro" ? "border-primary bg-muted/50" : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="pro" id="pro" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <P className="font-semibold">Pro Plan</P>
                    <Muted className="text-sm">${proAddon.price}/seat/month</Muted>
                  </div>
                  <P className="font-bold text-lg">${proTotalPrice}/mo</P>
                </div>
                
                {/* Always visible features */}
                <div className="mt-2 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    <Muted className="text-xs">Unlimited requests (pay as you go)</Muted>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    <Muted className="text-xs">Advanced analytics & sessions</Muted>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    <Muted className="text-xs">Cache, rate limiting, custom properties</Muted>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedPlan === "pro" && (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <P className="text-sm">Number of seats:</P>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleSeatChange(-1);
                      }}
                      type="button"
                    >
                      <Minus size={14} />
                    </Button>
                    <P className="w-10 text-center text-sm font-medium">{seats}</P>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleSeatChange(1);
                      }}
                      type="button"
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="prompts"
                      checked={selectedAddons.prompts}
                      onCheckedChange={(checked) => {
                        setSelectedAddons(prev => ({ ...prev, prompts: !!checked }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label 
                      htmlFor="prompts" 
                      className="text-sm cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Prompts workspace
                    </Label>
                  </div>
                  <Muted className="text-sm font-medium">+${promptsPrice.data?.data || 50}/mo</Muted>
                </div>
              </div>
            )}
          </label>

          {/* Team Bundle Option */}
          <label 
            htmlFor="team"
            className={`relative flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors ${
              selectedPlan === "team" ? "border-primary bg-muted/50" : "hover:bg-muted/30"
            }`}
          >
            <RadioGroupItem value="team" id="team" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <P className="font-semibold">Team Bundle</P>
                  <Muted className="text-sm">Best value for teams</Muted>
                </div>
                <P className="font-bold text-lg">$200/mo</P>
              </div>
              
              {/* Always visible features */}
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-primary" />
                  <Muted className="text-xs">Everything in Pro</Muted>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-primary" />
                  <Muted className="text-xs">Unlimited seats included</Muted>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-primary" />
                  <Muted className="text-xs">Prompts workspace included</Muted>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-primary" />
                  <Muted className="text-xs">Best for teams with 3+ members</Muted>
                </div>
              </div>
            </div>
          </label>
        </RadioGroup>

        <Button
          variant="action"
          className="w-full"
          onClick={async () => {
            if (selectedPlan === "team") {
              const result = await upgradeToTeamBundle.mutateAsync();
              if (result.data) {
                window.open(result.data, "_blank");
              }
            } else {
              const result = await upgradeToPro.mutateAsync({
                addons: selectedAddons,
                seats,
              });
              if (result.data) {
                window.open(result.data, "_blank");
              }
            }
          }}
          disabled={upgradeToPro.isPending || upgradeToTeamBundle.isPending}
        >
          {upgradeToPro.isPending || upgradeToTeamBundle.isPending
            ? "Loading..."
            : "Start 7-day free trial"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

