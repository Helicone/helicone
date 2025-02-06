"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";

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

const ADDONS: PricingAddon[] = [
  {
    key: "pro",
    name: "Pro Plan",
    price: 20,
    description: "No log limits, sessions, cache, user analytics, and more.",
  },
  {
    key: "prompts",
    name: "Prompts",
    price: 50,
    description: "Create, version and test prompts",
  },
  {
    key: "evals",
    name: "Evaluations",
    price: 100,
    description: "Evaluate prompt performance",
  },
  {
    key: "experiments",
    name: "Experiments",
    price: 50,
    description: "Run A/B tests on prompts",
  },
];

const TEAM_BUNDLE_PRICE = 200;

export const UpgradeProDialog = ({
  open,
  onOpenChange,
  subscription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: any;
}) => {
  const org = useOrg();
  const [activeTab, setActiveTab] = useState("addons");
  const [selectedAddons, setSelectedAddons] = useState<Addons>({
    pro: true,
    prompts: false,
    experiments: false,
    evals: false,
  });
  const [seats, setSeats] = useState(1);

  const upgradeToPro = useMutation({
    mutationFn: async (variables: { addons: Addons; seats?: number }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const endpoint =
        subscription?.data?.status === "canceled"
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
        subscription?.data?.status === "canceled"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Choose your add-ons or select the Team Bundle to unlock all
            features. Start with a 7-day free trial, cancel anytime.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="addons"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="addons">Add-ons</TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              Team Bundle
              {savings > 0 && (
                <span className="text-xs text-sky-500 font-medium">
                  (Save {savings}%)
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Add-ons Tab Content */}
          <TabsContent value="addons">
            <div className="space-y-4">
              {/* Pro Plan Card */}
              <div className="p-4 rounded-lg border border-primary border-black bg-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Pro Plan</h3>
                  <span className="font-semibold">
                    ${proAddon.price * seats}/mo
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {proAddon.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Seats:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleSeatChange(-1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold">{seats}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleSeatChange(1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Add-ons List */}
              {otherAddons.map((addon) => (
                <div
                  key={addon.key}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedAddons[addon.key as keyof Addons]
                      ? "border-primary border-black bg-slate-100"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleAddonToggle(addon.key as keyof Addons)}
                >
                  <div className="flex items-center gap-4">
                    <AddOnGraphic
                      type={addon.key as "prompts" | "evals" | "experiments"}
                    />
                    <div className="flex-grow">
                      <h3 className="font-semibold capitalize">{addon.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {addon.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">${addon.price}/mo</span>
                      {selectedAddons[addon.key as keyof Addons] && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Total Price */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">${totalPrice}/mo</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Team Bundle Tab Content */}
          <TabsContent value="team">
            <div className="p-6 rounded-lg border-2 border-primary bg-primary/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Team Bundle</h3>
                  <p className="text-muted-foreground">
                    Everything you need for your entire team
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">$200/mo</div>
                  <div className="text-sm text-green-600 font-medium">
                    Save $100+/mo (33%)
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="grid gap-3 mt-6">
                {[
                  "Unlimited seats",
                  "All Pro features",
                  "Prompts workspace",
                  "Evaluations suite",
                  "Experiments platform",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          size="lg"
          variant="action"
          className="w-full bg-brand text-white text-lg hover:bg-brand/90 bg-sky-500"
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
    prompts: <MessageSquareText className="w-8 h-8" />,
    evals: <GanttChartSquare className="w-8 h-8" />,
    experiments: <SplitSquareHorizontal className="w-8 h-8" />,
  };

  return (
    <div className={`${className} p-2 bg-primary/10 rounded-full`}>
      {icons[type]}
    </div>
  );
}
