import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Fragment } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { useUpgradePlan } from "@/hooks/useUpgradePlan";
import { H2, Small } from "@/components/ui/typography";

interface PricingTier {
  name: string;
  price: string;
  priceDetail?: string;
  ctaText?: string;
  ctaHref?: string;
  isPrimary?: boolean;
  badge: string;
  badgeClass: string;
  showCTA?: boolean;
  onCtaClick?: () => void;
}

interface Feature {
  name: string;
  hobby: string | boolean;
  pro: string | boolean;
  team: string | boolean;
  enterprise?: string | boolean;
  tooltip?: "usage";
}

interface FeatureGroup {
  title: string;
  features: Feature[];
}

const USAGE_PRICING_TIERS = [
  { min: 0, max: 10_000, rate: 0.0 },
  { min: 10_000, max: 25_000, rate: 0.0016 },
  { min: 25_000, max: 50_000, rate: 0.0008 },
  { min: 50_000, max: 100_000, rate: 0.00035 },
  { min: 100_000, max: 2_000_000, rate: 0.0003 },
  { min: 2_000_000, max: 15_000_000, rate: 0.000128 },
  { min: 15_000_000, max: Infinity, rate: 0.000083 },
];

const featureGroups: FeatureGroup[] = [
  {
    title: "Core Features",
    features: [
      {
        name: "Seats",
        hobby: "1",
        pro: "$20/seat",
        team: "Unlimited",
      },
      {
        name: "Caching",
        hobby: false,
        pro: true,
        team: true,
      },
      {
        name: "Rate limits",
        hobby: false,
        pro: true,
        team: true,
      },
      {
        name: "Logs",
        hobby: "10,000 logs/mo",
        pro: "10,000 logs/mo",
        team: "10,000 logs/mo",
      },
      {
        name: "Additional logs",
        hobby: false,
        pro: "Usage-based",
        team: "Usage-based",
        tooltip: "usage",
      },
      {
        name: "Sessions",
        hobby: false,
        pro: true,
        team: true,
      },
      {
        name: "User analytics",
        hobby: false,
        pro: "Unlimited",
        team: "Unlimited",
      },
      {
        name: "Custom properties",
        hobby: false,
        pro: true,
        team: true,
      },
      {
        name: "Alerts",
        hobby: false,
        pro: true,
        team: true,
      },
      {
        name: "Webhooks",
        hobby: false,
        pro: true,
        team: true,
      },
      {
        name: "Prompt management",
        hobby: false,
        pro: "$50/mo add-on",
        team: true,
      },
      {
        name: "Prompt experiments",
        hobby: false,
        pro: "$50/mo add-on",
        team: true,
      },
      {
        name: "Evaluators",
        hobby: false,
        pro: "$100/mo add-on",
        team: true,
      },
      {
        name: "Datasets",
        hobby: false,
        pro: true,
        team: true,
      },
    ],
  },
];

export default function SimplePricingComparisonTable() {
  const [showUsageTiers, setShowUsageTiers] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const { handleUpgradeTeam } = useUpgradePlan();

  const tiers: PricingTier[] = [
    {
      name: "Hobby",
      price: "Free",
      ctaText: "Get started",
      ctaHref: "https://us.helicone.ai/signup",
      badge: "CURRENT PLAN",
      badgeClass:
        "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-2 py-1 font-normal text-sm",
      showCTA: false,
    },
    {
      name: "Pro",
      price: "$20",
      priceDetail: "/seat/mo",
      ctaText: "Start 7-day trial",
      ctaHref: "https://us.helicone.ai/settings/billing",
      isPrimary: true,
      badge: "POPULAR",
      badgeClass:
        "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-2 border-[hsl(var(--primary))] rounded-full",
      showCTA: true,
      onCtaClick: () => setIsUpgradeDialogOpen(true),
    },
    {
      name: "Team",
      price: "$200",
      priceDetail: "/mo",
      ctaText: "Start 7-day trial",
      ctaHref: "https://us.helicone.ai/settings/billing",
      badge: "BEST VALUE",
      badgeClass:
        "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-2 border-[hsl(var(--border))] rounded-full",
      showCTA: true,
      onCtaClick: () => handleUpgradeTeam(),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <H2>Compare plans</H2>
      <div className="rounded-xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] border-none align-top">
              <TableHead className="min-w-[180px] p-6 bg-[hsl(var(--background))] rounded-tl-xl" />
              {tiers.map((tier, index) => (
                <TableHead
                  key={tier.name}
                  className={`px-6 py-[18px] align-top ${
                    tier.isPrimary
                      ? "bg-[hsl(var(--accent))]"
                      : "bg-[hsl(var(--background))]"
                  } 
                    ${index === tiers.length - 1 ? "rounded-tr-xl" : ""}`}
                >
                  <div className="flex md:flex-col flex-col gap-5">
                    <div className="text-[hsl(var(--foreground))] text-xl font-semibold">
                      {tier.name}
                    </div>
                    <div className="flex md:justify-between md:items-center md:gap-12 gap-4 md:flex-row flex-col">
                      <div className={tier.priceDetail ? "w-[116px]" : ""}>
                        <span
                          className={`${
                            tier.isPrimary
                              ? "text-[hsl(var(--primary))]"
                              : "text-[hsl(var(--foreground))]"
                          } text-xl font-bold`}
                        >
                          {tier.price}
                        </span>
                        {tier.priceDetail && (
                          <span className="text-[hsl(var(--muted-foreground))] text-base font-normal">
                            {tier.priceDetail}
                          </span>
                        )}
                      </div>
                      <div className={cn("px-3 shrink-0", tier.badgeClass)}>
                        <Small className="text-center whitespace-nowrap">
                          {tier.badge}
                        </Small>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {tier.showCTA && tier.ctaHref && tier.ctaText && (
                        <Button
                          onClick={tier.onCtaClick}
                          className={`w-full text-sm font-medium ${
                            tier.isPrimary
                              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
                              : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/90"
                          }`}
                        >
                          {tier.ctaText}
                        </Button>
                      )}
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {featureGroups.map((group, index) => (
            <TableBody key={group.title} className="relative">
              {group.features.map((feature, featureIndex) => (
                <Fragment key={feature.name}>
                  <TableRow className="hover:bg-[hsl(var(--background))]">
                    <TableCell
                      className={`w-[180px] px-6 py-3 ${
                        featureIndex === group.features.length - 1
                          ? "border-b border-[hsl(var(--border))]"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[hsl(var(--muted-foreground))] text-sm font-normal">
                            {feature.name}
                          </span>
                          {feature.tooltip === "usage" && (
                            <button
                              onClick={() => setShowUsageTiers(!showUsageTiers)}
                              className="p-1 hover:bg-[hsl(var(--muted))] rounded-full transition-colors"
                            >
                              <ChevronDownIcon
                                className={`w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform ${
                                  showUsageTiers ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                        </div>
                        {feature.tooltip === "usage" && showUsageTiers && (
                          <div className="pl-2 pt-4 w-full min-w-[250px]">
                            <Table className="w-full">
                              <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                  <TableHead className="text-[hsl(var(--muted-foreground))] font-medium px-0 py-1">
                                    Logs per month
                                  </TableHead>
                                  <TableHead className="text-[hsl(var(--muted-foreground))] font-medium px-0 py-1 text-right">
                                    Rate per log
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {USAGE_PRICING_TIERS.map((tier, i) => (
                                  <TableRow
                                    key={i}
                                    className="hover:bg-transparent"
                                  >
                                    <TableCell className="px-0 py-1 text-sm text-[hsl(var(--muted-foreground))]">
                                      {tier.min.toLocaleString()} -{" "}
                                      {tier.max === Infinity
                                        ? "∞"
                                        : tier.max.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="px-0 py-1 text-right text-sm text-[hsl(var(--muted-foreground))]">
                                      ${tier.rate.toFixed(5)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {[
                      feature.hobby,
                      feature.pro,
                      feature.team,
                      feature.enterprise,
                    ].map((value, index) => (
                      <TableCell
                        key={index}
                        className={`px-6 py-3 ${
                          index === 1 ? "bg-[hsl(var(--accent))]" : ""
                        } ${
                          featureIndex === group.features.length - 1
                            ? "border-b border-[hsl(var(--border))]"
                            : ""
                        }`}
                      >
                        {typeof value === "string" ? (
                          <div className="text-[hsl(var(--muted-foreground))] text-sm font-normal">
                            {value}
                          </div>
                        ) : value === true ? (
                          <CheckIcon className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                        ) : null}
                      </TableCell>
                    ))}
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          ))}
        </Table>
      </div>
      <UpgradeProDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
      />
    </div>
  );
}
