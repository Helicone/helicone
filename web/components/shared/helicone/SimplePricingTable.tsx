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

const tiers: PricingTier[] = [
  {
    name: "Hobby",
    price: "Free",
    ctaText: "Get started",
    ctaHref: "https://us.helicone.ai/signup",
    badge: "CURRENT PLAN",
    badgeClass: "bg-slate-100 text-slate-500 px-2 py-1 font-normal text-sm",
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
      "bg-[#0ca5ea] text-white border-2 border-[#0ca5ea] rounded-full",
    showCTA: true,
  },
  {
    name: "Team",
    price: "$200",
    priceDetail: "/mo",
    ctaText: "Start 7-day trial",
    ctaHref: "https://us.helicone.ai/settings/billing",
    badge: "BEST VALUE",
    badgeClass:
      "bg-slate-200 text-slate-500 border-2 border-slate-200 rounded-full",
    showCTA: true,
  },
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

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-black text-4xl font-bold">Compare plans</h2>
      <div className="rounded-xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-none align-top">
              <TableHead className="w-[200px] p-6 bg-white rounded-tl-xl" />
              {tiers.map((tier, index) => (
                <TableHead
                  key={tier.name}
                  className={`px-6 py-[18px] align-top ${
                    tier.isPrimary ? "bg-sky-50" : "bg-white"
                  } 
                    ${index === tiers.length - 1 ? "rounded-tr-xl" : ""}`}
                >
                  <div className="flex md:flex-col gap-5">
                    <div className="text-slate-900 text-xl font-semibold">
                      {tier.name}
                    </div>
                    <div className="flex justify-between items-center gap-12">
                      <div className={tier.priceDetail ? "w-[116px]" : ""}>
                        <span
                          className={`${
                            tier.isPrimary ? "text-sky-900" : "text-slate-900"
                          } text-xl font-bold`}
                        >
                          {tier.price}
                        </span>
                        {tier.priceDetail && (
                          <span className="text-slate-400 text-base font-normal">
                            {tier.priceDetail}
                          </span>
                        )}
                      </div>
                      <div className={cn("px-3 shrink-0", tier.badgeClass)}>
                        <div className="text-center text-sm font-normal whitespace-nowrap">
                          {tier.badge}
                        </div>
                      </div>
                    </div>
                    {tier.showCTA && tier.ctaHref && tier.ctaText && (
                      <Button
                        onClick={() => handleUpgradeTeam()}
                        className={`w-full text-sm font-medium ${
                          tier.isPrimary
                            ? "bg-[#0ca5ea] text-white hover:bg-[#0ca5ea]/90"
                            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                        }`}
                      >
                        {tier.ctaText}
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {featureGroups.map((group, index) => (
            <TableBody key={group.title} className="relative">
              {group.features.map((feature, featureIndex) => (
                <Fragment key={feature.name}>
                  <TableRow className="hover:bg-white">
                    <TableCell
                      className={`w-[318px] px-6 py-3 ${
                        featureIndex === group.features.length - 1
                          ? "border-b"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-sm font-normal">
                            {feature.name}
                          </span>
                          {feature.tooltip === "usage" && (
                            <button
                              onClick={() => setShowUsageTiers(!showUsageTiers)}
                              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                            >
                              <ChevronDownIcon
                                className={`w-4 h-4 text-slate-400 transition-transform ${
                                  showUsageTiers ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                        </div>
                        {feature.tooltip === "usage" && showUsageTiers && (
                          <div className="pl-8 pt-4">
                            <Table className="w-full">
                              <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                  <TableHead className="text-slate-500 font-medium px-0 py-1">
                                    Logs per month
                                  </TableHead>
                                  <TableHead className="text-slate-500 font-medium px-0 py-1 text-right">
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
                                    <TableCell className="px-0 py-1 text-sm text-slate-500">
                                      {tier.min.toLocaleString()} -{" "}
                                      {tier.max === Infinity
                                        ? "∞"
                                        : tier.max.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="px-0 py-1 text-right text-sm text-slate-500">
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
                          index === 1 ? "bg-sky-50" : ""
                        } ${
                          featureIndex === group.features.length - 1
                            ? "border-b"
                            : ""
                        }`}
                      >
                        {typeof value === "string" ? (
                          <div className="text-slate-500 text-sm font-normal">
                            {value}
                          </div>
                        ) : value === true ? (
                          <CheckIcon className="w-5 h-5 text-slate-500" />
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
