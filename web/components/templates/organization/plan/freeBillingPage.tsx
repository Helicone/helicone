import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Check,
} from "lucide-react";
import { useState } from "react";
import { UpgradeProDialog } from "./upgradeProDialog";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUpgradePlan } from "@/hooks/useUpgradePlan";

export const FreePlanCard = () => {
  const org = useOrg();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { handleUpgradeTeam, isLoading } = useUpgradePlan();

  const freeUsage = useQuery({
    queryKey: ["free-usage", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const invoice = await jawn.GET("/v1/stripe/subscription/free/usage");
      return invoice;
    },
  });

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
    <div className="flex w-full max-w-5xl flex-col gap-6 px-4 pb-8">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-medium">Free</CardTitle>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-800">
              Current plan
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground text-slate-500">
            <CalendarIcon className="h-4 w-4" />
            <span>Current billing period: {getBillingCycleDates()}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Requests used</span>
              <span className="text-slate-500">
                {freeUsage.data?.data?.toLocaleString()} / 10,000
              </span>
            </div>
            <Progress
              value={((freeUsage.data?.data ?? 0) / 10_000) * 100}
              className="h-2"
            />
          </div>

          {/* Plan comparison */}
          <div className="grid gap-6 md:grid-cols-2 lg:max-w-full">
            <Card className="flex max-w-[500px] flex-col">
              <CardHeader>
                <CardTitle>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Pro Plan</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">$79</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-slate-500">
                  Unlimited seats, $6/GB usage-based billing
                </p>
                <ul className="space-y-2.5">
                  {proFeatures.slice(0, 4).map((feature) => (
                    <li key={feature.title} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-sky-500" />
                      <span className="text-sm">{feature.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  variant="action"
                  className="w-full bg-sky-500 text-white hover:bg-sky-600"
                  onClick={() => setShowUpgradeDialog(true)}
                >
                  Start 7-day free trial
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex max-w-[500px] flex-col">
              <CardHeader>
                <CardTitle>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Team Bundle</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">$799</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm font-medium">Unlimited seats, 5 orgs</p>
                <ul className="space-y-2.5">
                  {teamBundleFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-sky-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => handleUpgradeTeam()}
                >
                  Start 7-day free trial
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison - Now placed outside the main card */}
      <Collapsible
        open={isComparisonOpen}
        onOpenChange={setIsComparisonOpen}
        className="w-full"
      >
        <CollapsibleContent className="space-y-4 transition-all">
          <Card>
            <CardHeader>
              <CardTitle>Complete Pro Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-background p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {proFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="group rounded-lg p-4 transition-colors hover:bg-muted/5"
                    >
                      <div className="flex gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                        <div>
                          <h4 className="text-sm font-medium transition-colors group-hover:text-primary">
                            {feature.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>

        <div className="mt-4 flex justify-center">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-foreground"
            >
              {isComparisonOpen ? (
                <>
                  <ChevronUpIcon className="mr-2 h-4 w-4" />
                  Show fewer features
                </>
              ) : (
                <>
                  <ChevronDownIcon className="mr-2 h-4 w-4" />
                  See all Pro features
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </Collapsible>

      {/* Additional Options */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex h-full flex-col">
          <CardHeader className="space-y-1.5">
            <CardTitle className="text-2xl font-semibold">
              Learn about our Enterprise plan
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Built for companies looking to scale. Includes everything in Pro,
              plus unlimited requests, dedicated support and more.
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

        <Card className="flex h-full flex-col">
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

      <UpgradeProDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
      />
    </div>
  );
};

const proFeatures = [
  {
    title: "Unlimited seats",
    description: "Add your whole team at no extra cost",
  },
  {
    title: "Unlimited requests",
    description: "Scale your requests without limits",
  },
  {
    title: "Usage-based billing",
    description: "$6/GB - only pay for what you use",
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
    title: "Prompts",
    description: "Manage and version your prompts",
  },
  {
    title: "HQL & Alerts",
    description: "Query language and notifications",
  },
  {
    title: "API Access",
    description: "Access to 10 calls/min using our API",
  },
  {
    title: "1 month log retention",
    description: "Store your logs for 30 days",
  },
  {
    title: "Caching & Rate Limits",
    description: "Gateway features included",
  },
  {
    title: "Webhooks",
    description: "Connect to external services",
  },
  {
    title: "Chat & Email Support",
    description: "Get help when you need it",
  },
];

const teamBundleFeatures = [
  "Everything in Pro",
  "SOC-2 & HIPAA compliance",
  "Dedicated Slack channel",
  "Support engineer & SLAs",
];
