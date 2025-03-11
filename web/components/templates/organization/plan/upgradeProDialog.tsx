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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquareText,
  GanttChartSquare,
  SplitSquareHorizontal,
  Check,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureName } from "@/hooks/useProFeature";
import {
  useCostForEvals,
  useCostForExperiments,
  useCostForPrompts,
} from "../../pricing/hooks";
import { H3, H4, P, Muted, Small } from "@/components/ui/typography";
import { InfoBox } from "@/components/ui/helicone/infoBox";

export type Addons = {
  pro: boolean;
  prompts: boolean;
  experiments: boolean;
  evals: boolean;
};

type AddonKey = "pro" | "prompts" | "experiments" | "evals";

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
    "Select add-ons or Team Bundle to unlock features. 7-day free trial included.",
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
  const [activeTab, setActiveTab] = useState("addons");
  const [selectedAddons, setSelectedAddons] = useState<Addons>({
    pro: true,
    prompts: false,
    experiments: false,
    evals: false,
  });
  const [seats, setSeats] = useState(1);
  const promptsPrice = useCostForPrompts();
  const evalsPrice = useCostForEvals();
  const experimentsPrice = useCostForExperiments();

  // Initialize selected addons based on featureName
  useEffect(() => {
    console.log("featureName", featureName);
    if (open && featureName) {
      // Convert featureName to lowercase to match addon keys
      const featureKey = featureName.toLowerCase() as keyof Addons;

      // Check if the featureKey is a valid addon key
      if (featureKey in selectedAddons) {
        setSelectedAddons((prev) => ({
          ...prev,
          [featureKey]: true,
        }));
      }
    }
  }, [open, featureName]);

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
            experiments: variables.addons.experiments,
            evals: variables.addons.evals,
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

  const handleAddonToggle = (addon: keyof Addons) => {
    if (addon === "pro") return;
    setSelectedAddons((prev) => ({ ...prev, [addon]: !prev[addon] }));
  };

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
      {
        key: "evals",
        name: "Evaluations",
        price: evalsPrice.data?.data || 100,
        description: "Evaluate prompt performance",
      },
      {
        key: "experiments",
        name: "Experiments",
        price: experimentsPrice.data?.data || 50,
        description: "Run A/B tests on prompts",
      },
    ],
    [promptsPrice.data, evalsPrice.data, experimentsPrice.data]
  );

  const proAddon = ADDONS.find((a) => a.key === "pro")!;
  const otherAddons = ADDONS.filter((a) => a.key !== "pro");

  const totalPrice = useMemo(() => {
    const base = selectedAddons.pro ? proAddon.price * seats : 0;
    const extras = ADDONS.filter((a) => a.key !== "pro").reduce(
      (sum, addon) => sum + (selectedAddons[addon.key] ? addon.price : 0),
      0
    );
    return base + extras;
  }, [selectedAddons, seats]);

  const savings = useMemo(() => {
    const maxPrice =
      proAddon.price * seats +
      otherAddons.reduce((sum, addon) => sum + addon.price, 0);
    const difference = maxPrice - TEAM_BUNDLE_PRICE;
    const percentage = Math.floor((difference / maxPrice) * 100);
    return percentage > 0 ? percentage : 0;
  }, [seats]);

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
          <InfoBox variant="warning" className="text-sm py-1">
            {limitMessage}
          </InfoBox>
        </div>
      );
    }

    // Default case - standard upgrade header
    return (
      <DialogTitle className="text-foreground text-xl font-bold">
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

        <Tabs
          defaultValue="addons"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col gap-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="addons">Add-ons</TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-1">
              Team Bundle
              {savings > 0 && (
                <Small className="text-sky-500">(Save {savings}%)</Small>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Add-ons Tab Content */}
          <TabsContent value="addons" className="flex flex-col gap-3 mt-0">
            {/* Pro Plan Card */}
            <div className="rounded-lg border border-primary bg-muted p-3">
              <div className="flex items-center justify-between mb-1">
                <H4>Pro Plan</H4>
                <P className="font-semibold">${proAddon.price * seats}/mo</P>
              </div>
              <Muted className="mb-2 text-sm">{proAddon.description}</Muted>
              <div className="flex items-center justify-between">
                <P className="text-foreground text-sm">Seats:</P>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSeatChange(-1)}
                  >
                    <Minus size={14} />
                  </Button>
                  <P className="font-semibold w-5 text-center">{seats}</P>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSeatChange(1)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Add-ons List */}
            <div className="grid grid-cols-1 gap-2">
              {otherAddons.map((addon) => (
                <div
                  key={addon.key}
                  className={`rounded-lg border p-2.5 transition-colors cursor-pointer ${
                    selectedAddons[addon.key as keyof Addons]
                      ? "border-primary bg-muted"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleAddonToggle(addon.key as keyof Addons)}
                >
                  <div className="flex items-center gap-2">
                    <AddOnGraphic
                      type={addon.key as "prompts" | "evals" | "experiments"}
                      className="shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <P className="font-semibold capitalize text-sm">
                        {addon.name}
                      </P>
                      <Muted className="text-xs truncate">
                        {addon.description}
                      </Muted>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pl-1">
                      <P className="font-semibold text-sm">${addon.price}/mo</P>
                      {selectedAddons[addon.key as keyof Addons] && (
                        <Check size={16} className="text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Price */}
            <div className="p-2 bg-muted rounded-lg mt-1">
              <div className="flex justify-between items-center">
                <P className="font-semibold">Total</P>
                <P className="font-semibold">${totalPrice}/mo</P>
              </div>
            </div>
          </TabsContent>

          {/* Team Bundle Tab Content */}
          <TabsContent value="team" className="mt-0">
            <div className="p-3 rounded-lg border-2 border-primary bg-primary/5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-0.5">
                  <H3>Team Bundle</H3>
                  <Muted className="text-sm">Everything for your team</Muted>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <P className="text-xl font-bold">$200/mo</P>
                </div>
              </div>

              {/* Features List */}
              <div className="grid grid-cols-1 gap-y-1.5 mt-2">
                {[
                  "Unlimited seats",
                  "All Pro features",
                  "Prompts workspace",
                  "Evaluations suite",
                  "Experiments platform",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5">
                    <Check size={14} className="text-primary shrink-0" />
                    <P className="text-sm">{feature}</P>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          size="default"
          variant="action"
          className="w-full text-primary-foreground mt-1"
          onClick={async () => {
            if (activeTab === "team") {
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
          disabled={upgradeToPro.isLoading || upgradeToTeamBundle.isLoading}
        >
          Start 7-day free trial
        </Button>
      </DialogContent>
    </Dialog>
  );
};

function AddOnGraphic({
  type,
  className = "",
}: {
  type: "prompts" | "evals" | "experiments";
  className?: string;
}) {
  const icons = {
    prompts: <MessageSquareText size={18} />,
    evals: <GanttChartSquare size={18} />,
    experiments: <SplitSquareHorizontal size={18} />,
  };

  return (
    <div className={`${className} p-1.5 bg-primary/10 rounded-full`}>
      {icons[type]}
    </div>
  );
}
