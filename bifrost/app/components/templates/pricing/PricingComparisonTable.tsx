import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import {
  StickyTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState, Fragment } from "react";

interface PricingTier {
  name: string;
  ctaText: string;
  ctaHref: string;
  isPrimary?: boolean;
}

interface Feature {
  name: string;
  hobby: string | boolean;
  pro: string | boolean;
  team: string | boolean;
  enterprise: string | boolean;
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
    ctaText: "Get started",
    ctaHref: "https://us.helicone.ai/signup",
  },
  {
    name: "Pro",
    ctaText: "7-day free trial",
    ctaHref: "https://us.helicone.ai/settings/billing",
    isPrimary: true,
  },
  {
    name: "Team",
    ctaText: "7-day free trial",
    ctaHref: "https://us.helicone.ai/settings/billing",
  },
  {
    name: "Enterprise",
    ctaText: "Contact sales",
    ctaHref: "https://us.helicone.ai/settings/billing",
  },
];

const featureGroups: FeatureGroup[] = [
  {
    title: "Workspace & collaboration",
    features: [
      {
        name: "Seats",
        hobby: "1",
        pro: "$20/seat",
        team: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "Organization",
        hobby: "1",
        pro: "1",
        team: "5",
        enterprise: "Unlimited",
      },
      {
        name: "Key vault",
        hobby: false,
        pro: false,
        team: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Monitoring",
    features: [
      {
        name: "Logs",
        hobby: "10,000 logs/mo",
        pro: "10,000 logs/mo",
        team: "10,000 logs/mo",
        enterprise: "Unlimited",
      },
      {
        name: "Additional logs",
        hobby: false,
        pro: "Usage-based",
        team: "Usage-based",
        enterprise: "Volume discount",
        tooltip: "usage",
      },
      {
        name: "Multi-modal",
        hobby: true,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Metrics dashboard",
        hobby: true,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Sessions",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "User analytics",
        hobby: false,
        pro: "Unlimited",
        team: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "Custom properties",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Alerts",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Prompts & Experiments",
    features: [
      {
        name: "Playground",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Prompt management ($50/mo add-on)",
        hobby: false,
        pro: "$50/mo add-on",
        team: true,
        enterprise: true,
      },
      {
        name: "• Collaborative workspace",
        hobby: false,
        pro: "Included",
        team: true,
        enterprise: true,
      },
      {
        name: "• Version history",
        hobby: false,
        pro: "Included",
        team: true,
        enterprise: true,
      },
      {
        name: "Prompt experiments ($50/mo add-on)",
        hobby: false,
        pro: "$50/mo add-on",
        team: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Evaluations",
    features: [
      {
        name: "Evaluators ($100/mo add-on)",
        hobby: false,
        pro: "$100/mo add-on",
        team: true,
        enterprise: true,
      },
      {
        name: "• Online evaluations (real-time)",
        hobby: false,
        pro: "Included",
        team: true,
        enterprise: true,
      },
      {
        name: "• Offline evaluations (batch)",
        hobby: false,
        pro: "Included",
        team: true,
        enterprise: true,
      },
      {
        name: "• LLM-as-a-judge, Python, LastMile AI",
        hobby: false,
        pro: "Included",
        team: true,
        enterprise: true,
      },
      {
        name: "User feedback",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Scores",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Fine-tuning",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Datasets",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Webhooks",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Gateway",
    features: [
      {
        name: "One-line integration",
        hobby: true,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Caching",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Rate limits",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "LLM guardrails",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "LLM moderation",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Gateway fallbacks",
        hobby: true,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Retries",
        hobby: true,
        pro: true,
        team: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Data",
    features: [
      {
        name: "Retention",
        hobby: "1 month",
        pro: "3 months",
        team: "3 months",
        enterprise: "Forever",
      },
      {
        name: "Ingestion",
        hobby: "1,200 logs/min",
        pro: "6,000 logs/min",
        team: "15,000 logs/min",
        enterprise: "30,000 logs/min",
      },
      {
        name: "API access",
        hobby: false,
        pro: "60 calls/min",
        team: "60 calls/min",
        enterprise: "1,000 calls/min",
      },
      {
        name: "Data export",
        hobby: true,
        pro: true,
        team: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Support",
    features: [
      {
        name: "Community (GitHub, Discord)",
        hobby: true,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Chat & email",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Private Slack channel",
        hobby: false,
        pro: false,
        team: true,
        enterprise: true,
      },
      {
        name: "Dedicated support engineer",
        hobby: false,
        pro: false,
        team: false,
        enterprise: true,
      },
      {
        name: "SLAs",
        hobby: false,
        pro: false,
        team: false,
        enterprise: true,
      },
    ],
  },
  {
    title: "Security",
    features: [
      {
        name: "Data region",
        hobby: "US/EU",
        pro: "US/EU",
        team: "US/EU",
        enterprise: "US/EU",
      },
      {
        name: "SAML SSO",
        hobby: false,
        pro: false,
        team: false,
        enterprise: true,
      },
      {
        name: "Data encryption",
        hobby: false,
        pro: false,
        team: false,
        enterprise: "Optional",
      },
      {
        name: "RBAC",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Omit logs",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Compliance",
    features: [
      {
        name: "GDPR",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "HIPAA",
        hobby: false,
        pro: false,
        team: true,
        enterprise: true,
      },
      {
        name: "SOC-2 Type II",
        hobby: false,
        pro: false,
        team: true,
        enterprise: true,
      },
      {
        name: "InfoSec reviews",
        hobby: false,
        pro: false,
        team: false,
        enterprise: true,
      },
      {
        name: "Customized MSAs",
        hobby: false,
        pro: false,
        team: false,
        enterprise: true,
      },
      {
        name: "Custom DPAs",
        hobby: false,
        pro: false,
        team: false,
        enterprise: true,
      },
    ],
  },
];

export default function PricingComparisonTable() {
  const [showUsageTiers, setShowUsageTiers] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-black text-4xl font-bold">Compare plans</h2>
      <div className="rounded-xl">
        <StickyTable>
          <TableHeader className="sticky top-[var(--header-offset)] z-20 bg-slate-50">
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-none">
              <TableHead className="w-[318px] p-6 bg-white rounded-tl-xl">
                <div className="text-slate-900 text-lg font-semibold">
                  {/* Empty header cell */}
                </div>
              </TableHead>
              {tiers.map((tier, index) => (
                <TableHead
                  key={tier.name}
                  className={`py-3 px-6 ${
                    tier.isPrimary ? "bg-sky-50" : "bg-white"
                  } 
                    ${index === tiers.length - 1 ? "rounded-tr-xl" : ""}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="text-slate-900 text-lg font-semibold">
                      {tier.name}
                    </div>
                    <Link href={tier.ctaHref}>
                      <Button
                        variant={tier.isPrimary ? "default" : "secondary"}
                        className={`w-full text-base ${
                          tier.isPrimary ? "bg-brand text-white" : ""
                        }`}
                      >
                        {tier.ctaText}
                      </Button>
                    </Link>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {featureGroups.map((group, index) => (
            <TableBody key={group.title} className="relative">
              {index !== 0 && (
                <TableRow className="h-12 bg-white hover:bg-white border-none">
                  <TableCell colSpan={2} />
                  <TableCell colSpan={1} className="bg-sky-50" />
                  <TableCell colSpan={2} />
                </TableRow>
              )}

              <TableRow className="hover:bg-white">
                <TableCell
                  colSpan={2}
                  className="bg-white border-b h-11 px-6 py-3"
                >
                  <div className="text-slate-700 text-sm font-medium">
                    {group.title}
                  </div>
                </TableCell>
                <TableCell colSpan={1} className="bg-sky-50" />
                <TableCell colSpan={2} />
              </TableRow>

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
                          <span className="text-slate-500 text-sm font-medium">
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
                          index === 1 ? "bg-[#0ca5ea]/5" : ""
                        } ${
                          featureIndex === group.features.length - 1
                            ? "border-b"
                            : ""
                        }`}
                      >
                        {typeof value === "string" ? (
                          <div className="text-slate-500 text-sm font-medium">
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
        </StickyTable>
      </div>
    </div>
  );
}
