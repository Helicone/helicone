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

export const FreePlanCard = () => {
  const org = useOrg();
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
        body: {},
      });
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
          <CardDescription>
            Here&apos;s a summary of your request usage this month.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            className="w-full h-2"
          />
          <div className="text-xs text-muted-foreground flex items-center text-slate-500">
            <CalendarIcon className="w-4 h-4 mr-1" />
            {getBillingCycleDates()}
          </div>
          <Col className="">
            <Button
              className="w-40 bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                const result = await upgradeToPro.mutateAsync();
                if (result.data) {
                  window.open(result.data, "_blank");
                } else {
                  console.error("No URL returned from upgrade mutation");
                }
              }}
              disabled={upgradeToPro.isLoading}
            >
              Upgrade to Pro
            </Button>
          </Col>
          <div>
            <button
              onClick={() => setIsComparisonOpen(!isComparisonOpen)}
              className="flex items-center justify-between w-full text-left font-medium mb-2"
            >
              <span>Compare to the Pro plan</span>
              {isComparisonOpen ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
            <span className="text-sm text-muted-foreground text-slate-500">
              The Pro plan covers everything in Free, and:
            </span>
            {isComparisonOpen && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                {proFeatures.map((feature, index) => (
                  <ComparisonItem key={index} {...feature} />
                ))}
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
    title: "100k requests",
    description: "Higher limit compared to 10k.",
  },
  {
    title: "3 month log retention",
    description: "Longer log retention compared to 1 month.",
  },
  {
    title: "Access to Playground",
    description: "Test your prompts with different models.",
  },
  {
    title: "Access to Caching",
    description: "Cache frequent responses to save costs and time.",
  },
  {
    title: "Access to Rate Limits",
    description: "Limit your user's usage.",
  },
  {
    title: "Access to Sessions",
    description: "Trace agent workflow and conversations.",
  },
  {
    title: "Access to User Tracking",
    description: "Keep track of your users.",
  },
  {
    title: "Access to Datasets",
    description: "Collect historical requests for training and finetuning.",
  },
  {
    title: "API Access",
    description: "Access to 60 calls/min using our expansive API.",
  },
  {
    title: "SOC-2 Type II Compliance",
    description: "Safety and privacy.",
  },
  {
    title: "Prompts & Experiments",
    description: "Collect historical requests for training and finetuning.",
  },
  {
    title: "Alerts (Slack + Email)",
    description: "Access to 60 calls/min using our expansive API.",
  },
];
