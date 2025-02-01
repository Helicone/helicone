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
import { Progress } from "@/components/ui/progress";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useCostForPrompts,
  useCostForEvals,
  useCostForExperiments,
} from "../../pricing/hooks";

export const FreePlanCard = () => {
  const org = useOrg();
  const [selectedAddons, setSelectedAddons] = useState({
    alerts: false,
    prompts: false,
    experiments: false,
    evals: false,
  });
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const costForPrompts = useCostForPrompts();
  const costForEvals = useCostForEvals();
  const costForExperiments = useCostForExperiments();

  const freeUsage = useQuery({
    queryKey: ["free-usage", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const invoice = await jawn.GET("/v1/stripe/subscription/free/usage");
      return invoice;
    },
  });

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
  });

  const upgradeToPro = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const endpoint =
        subscription.data?.data?.status === "canceled"
          ? "/v1/stripe/subscription/existing-customer/upgrade-to-pro"
          : "/v1/stripe/subscription/new-customer/upgrade-to-pro";
      const result = await jawn.POST(endpoint, {
        body: {
          addons: {
            alerts: selectedAddons.alerts,
            prompts: selectedAddons.prompts,
            experiments: selectedAddons.experiments,
            evals: selectedAddons.evals,
          },
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

  const isOverUsage = freeUsage.data?.data && freeUsage.data?.data >= 100_000;

  const getBillingCycleDates = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const formatDate = (date: Date) =>
      date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    return `${formatDate(startDate)} → ${formatDate(endDate)}`;
  };

  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  return (
    <div className="flex gap-6 lg:flex-row flex-col">
      <Card className="max-w-3xl w-full h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-end">
            Free{" "}
            <span className="text-sm bg-[#DBE9FE] text-blue-700 px-2 py-1 rounded-md ml-2 font-medium">
              Current plan
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="inline-flex items-center space-x-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Current billing period: {getBillingCycleDates()}</span>
          </div>

          <div>
            <div className="flex items-center gap-4 justify-between">
              <div className="text-sm text-muted-foreground font-medium">
                Requests used
              </div>
              <div className="text-slate-500">
                {freeUsage.data?.data?.toLocaleString()} / 10,000
              </div>
            </div>
            <Progress
              value={((freeUsage.data?.data ?? 0) / 10_000) * 100}
              className="w-full h-2 mt-2"
            />
          </div>

          <div className="border-t pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg hover:border-blue-200 transition-colors flex flex-col">
                <div>
                  <div className="font-medium text-lg mb-1">Pro Plan</div>
                  <div className="text-2xl font-bold mb-2">
                    $20
                    <span className="text-sm text-slate-500 font-normal">
                      /seat/mo
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mb-4">
                    + Optional add-ons starting at $50/mo
                  </div>
                  <ul className="space-y-2 mb-4">
                    {proFeatures.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-2" />
                        {feature.title}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto">
                  <Button
                    className="w-full text-white text-lg font-medium leading-normal tracking-normal h-[52px] px-6 py-1.5 bg-[#0da5e8] rounded-xl justify-center items-center gap-2.5 inline-flex"
                    onClick={() => setShowUpgradeDialog(true)}
                    variant="action"
                  >
                    Start 7-day free trial
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg hover:border-blue-200 transition-colors flex flex-col">
                <div>
                  <div className="font-medium text-lg mb-1">Team Bundle</div>
                  <div className="text-2xl font-bold mb-2">
                    $200
                    <span className="text-sm text-slate-500 font-normal">
                      /mo
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mb-4">
                    Unlimited seats
                  </div>
                  <ul className="space-y-2 mb-4">
                    {teamBundleFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto">
                  <Button
                    variant="action"
                    className="w-full text-sky-600 text-lg font-medium leading-normal tracking-normal h-[52px] px-6 py-1.5 bg-white hover:bg-blue-50 border-blue-200 rounded-xl justify-center items-center gap-2.5 inline-flex"
                    onClick={async () => {
                      const result = await upgradeToTeamBundle.mutateAsync();
                      if (result.data) {
                        window.open(result.data, "_blank");
                      }
                    }}
                  >
                    Start 7-day free trial
                  </Button>
                </div>
              </div>
            </div>

            {!isComparisonOpen && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
            )}

            <button
              onClick={() => setIsComparisonOpen(!isComparisonOpen)}
              className="flex items-center text-blue-600 text-sm mt-4"
            >
              {isComparisonOpen ? "Show less" : "See all Pro features"}
              {isComparisonOpen ? (
                <ChevronUpIcon className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              )}
            </button>

            {isComparisonOpen && (
              <div className="mt-4 space-y-4">
                <h4 className="font-medium text-sm text-slate-600">
                  Additional Pro Features:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proFeatures.slice(4).map((feature, index) => (
                    <ComparisonItem key={index + 4} {...feature} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 w-full lg:w-[450px]">
        <Card>
          <CardHeader>
            <CardTitle className="whitespace-nowrap">
              Learn about our Enterprise plan
            </CardTitle>
            <CardDescription>
              Built for companies looking to scale. Includes everything in Pro,
              plus unlimited requests, prompts, experiments and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Contact sales</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="whitespace-nowrap">
              Looking for something else?
            </CardTitle>
            <CardDescription>
              Need support, have a unique use case or want to say hi?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Contact us</Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Start Your Free Trial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-5">
              <h3 className="font-semibold text-gray-700">Optional Add-ons</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-200 transition-colors">
                  <Label
                    htmlFor="prompts-addon"
                    className="cursor-pointer flex-1"
                  >
                    <div className="font-medium">Prompts</div>
                    <div className="text-sm text-muted-foreground">
                      Manage and version your prompts
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      ${costForPrompts.data?.data ?? "..."}/mo
                    </div>
                  </Label>
                  <Switch
                    id="prompts-addon"
                    checked={selectedAddons.prompts}
                    onCheckedChange={(checked) =>
                      setSelectedAddons((prev) => ({
                        ...prev,
                        prompts: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-200 transition-colors">
                  <Label
                    htmlFor="experiments-addon"
                    className="cursor-pointer flex-1"
                  >
                    <div className="font-medium">Experiments</div>
                    <div className="text-sm text-muted-foreground">
                      Run and track experiments
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      ${costForExperiments.data?.data ?? "..."}/mo
                    </div>
                  </Label>
                  <Switch
                    id="experiments-addon"
                    checked={selectedAddons.experiments}
                    onCheckedChange={(checked) =>
                      setSelectedAddons((prev) => ({
                        ...prev,
                        experiments: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-200 transition-colors">
                  <Label
                    htmlFor="evals-addon"
                    className="cursor-pointer flex-1"
                  >
                    <div className="font-medium">Evals</div>
                    <div className="text-sm text-muted-foreground">
                      Evaluate model performance
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      ${costForEvals.data?.data ?? "..."}/mo
                    </div>
                  </Label>
                  <Switch
                    id="evals-addon"
                    checked={selectedAddons.evals}
                    onCheckedChange={(checked) =>
                      setSelectedAddons((prev) => ({ ...prev, evals: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <Button
              variant="action"
              onClick={async () => {
                const result = await upgradeToPro.mutateAsync();
                if (result.data) {
                  window.open(result.data, "_blank");
                }
                setShowUpgradeDialog(false);
              }}
              disabled={upgradeToPro.isLoading}
              className="w-full text-white text-lg font-medium leading-normal tracking-normal h-[52px] px-6 py-1.5 bg-[#0da5e8] rounded-xl justify-center items-center gap-2.5 inline-flex"
            >
              Start 7-day free trial
            </Button>
            <span className="text-slate-500 text-[12px] font-medium mt-2">
              Cancel anytime during the trial
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ComparisonItem = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex items-start space-x-2">
    <div>
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-muted-foreground font-normal text-slate-500">
        {description}
      </p>
    </div>
  </div>
);

const proFeatures = [
  {
    title: "Unlimited scaling",
    description: "Scale your requests without limits",
  },
  {
    title: "Sessions",
    description: "Trace agent workflow and conversations",
  },
  {
    title: "Playground",
    description: "Test your prompts with different models",
  },
  {
    title: "User Tracking",
    description: "Keep track of your users",
  },
  {
    title: "Rate Limits",
    description: "Limit your user's usage",
  },
  {
    title: "Datasets",
    description: "Collect historical requests for training and finetuning",
  },
  {
    title: "API Access",
    description: "Access to 60 calls/min using our expansive API",
  },
  {
    title: "3 month log retention",
    description: "Longer log retention compared to 1 month",
  },
  {
    title: "Caching",
    description: "Cache frequent responses to save costs and time",
  },
  {
    title: "SOC-2 Type II Compliance",
    description: "Safety and privacy",
  },
  {
    title: "Alerts",
    description: "Get notified via Slack + Email",
  },
  {
    title: "Prompts (Optional Add-on)",
    description: "Manage and version your prompts",
  },
  {
    title: "Experiments (Optional Add-on)",
    description: "Run and track experiments",
  },
  {
    title: "Evals (Optional Add-on)",
    description: "Evaluate model performance",
  },
];

const teamBundleFeatures = [
  "Unlimited seats",
  "Everything in Pro plan",
  "Prompts included",
  "Experiments included",
  "Evals included",
];
