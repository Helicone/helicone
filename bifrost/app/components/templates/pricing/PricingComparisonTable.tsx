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

const USAGE_PRICING_GB = [
  { label: "First 30 GB", rate: "$3.25/GB" },
  { label: "31-80 GB", rate: "$2.00/GB" },
  { label: "81-200 GB", rate: "$1.25/GB" },
  { label: "201-450 GB", rate: "$0.75/GB" },
  { label: "450+ GB", rate: "$0.50/GB" },
];

const USAGE_PRICING_REQUESTS = [
  { label: "First 10,000", rate: "Free" },
  { label: "10,001-30,000", rate: "$0.00070" },
  { label: "30,001-90,000", rate: "$0.00035" },
  { label: "90,001-250,000", rate: "$0.000175" },
  { label: "250,001-800,000", rate: "$0.0000875" },
  { label: "800,001-2,500,000", rate: "$0.00004375" },
  { label: "2,500,000+", rate: "$0.00002" },
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
        pro: "Unlimited",
        team: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "Organizations",
        hobby: "1",
        pro: "1",
        team: "5",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    title: "Monitoring",
    features: [
      {
        name: "Requests",
        hobby: "10,000/mo",
        pro: "Unlimited",
        team: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "Usage-based pricing",
        hobby: "10K requests",
        pro: "Tiered pricing",
        team: "Tiered pricing",
        enterprise: "Volume discount",
        tooltip: "usage",
      },
      {
        name: "Sessions",
        hobby: "Unlimited",
        pro: "Unlimited",
        team: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "User analytics",
        hobby: "Unlimited",
        pro: "Unlimited",
        team: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "Custom properties",
        hobby: "Unlimited",
        pro: "Unlimited",
        team: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "HQL (Query Language)",
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
      {
        name: "Reports",
        hobby: false,
        pro: true,
        team: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Prompts & Testing",
    features: [
      {
        name: "Playground",
        hobby: "Unlimited",
        pro: "Unlimited",
        team: "Unlimited (credits)",
        enterprise: "Unlimited",
      },
      {
        name: "Prompts",
        hobby: "Unlimited",
        pro: "Unlimited",
        team: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "Scores",
        hobby: "Unlimited",
        pro: "Unlimited",
        team: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "Datasets",
        hobby: "Unlimited",
        pro: "Unlimited",
        team: "Unlimited",
        enterprise: "Unlimited",
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
        name: "Caching",
        hobby: true,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Rate limits",
        hobby: true,
        pro: true,
        team: true,
        enterprise: true,
      },
      {
        name: "Automatic fallbacks",
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
        hobby: "7 days",
        pro: "1 month",
        team: "3 months",
        enterprise: "Forever",
      },
      {
        name: "Configurable retention",
        hobby: false,
        pro: false,
        team: true,
        enterprise: true,
      },
      {
        name: "Ingestion",
        hobby: "10 logs/min",
        pro: "1,000 logs/min",
        team: "15,000 logs/min",
        enterprise: "30,000 logs/min",
      },
      {
        name: "API access",
        hobby: false,
        pro: "10 calls/min",
        team: "60 calls/min",
        enterprise: "1,000 calls/min",
      },
      {
        name: "Data export",
        hobby: false,
        pro: false,
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
        team: true,
        enterprise: true,
      },
      {
        name: "SLAs",
        hobby: false,
        pro: false,
        team: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Compliance",
    features: [
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
        name: "SAML SSO",
        hobby: false,
        pro: false,
        team: false,
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
    ],
  },
];

export default function PricingComparisonTable() {
  const [showUsageTiers, setShowUsageTiers] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-black text-4xl font-bold">Compare plans</h2>
      <div className="rounded-xl overflow-x-auto lg:overflow-x-visible">
        <StickyTable>
          <TableHeader className="lg:sticky top-[var(--header-offset)] z-20 bg-slate-50">
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
                        className={`w-full text-sm`}
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
                          <div className="pl-8 pt-4 space-y-4">
                            {/* Storage Pricing */}
                            <div>
                              <div className="text-slate-600 text-xs font-semibold mb-2">
                                Storage Pricing
                              </div>
                              <Table className="w-full">
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-slate-500 font-medium px-0 py-1">
                                      Usage
                                    </TableHead>
                                    <TableHead className="text-slate-500 font-medium px-0 py-1 text-right">
                                      Rate
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {USAGE_PRICING_GB.map((tier, i) => (
                                    <TableRow
                                      key={i}
                                      className="hover:bg-transparent"
                                    >
                                      <TableCell className="px-0 py-1 text-sm text-slate-500">
                                        {tier.label}
                                      </TableCell>
                                      <TableCell className="px-0 py-1 text-right text-sm text-slate-500">
                                        {tier.rate}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            {/* Request Pricing */}
                            <div>
                              <div className="text-slate-600 text-xs font-semibold mb-2">
                                Request Pricing
                              </div>
                              <Table className="w-full">
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-slate-500 font-medium px-0 py-1">
                                      Requests
                                    </TableHead>
                                    <TableHead className="text-slate-500 font-medium px-0 py-1 text-right">
                                      Rate
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {USAGE_PRICING_REQUESTS.map((tier, i) => (
                                    <TableRow
                                      key={i}
                                      className="hover:bg-transparent"
                                    >
                                      <TableCell className="px-0 py-1 text-sm text-slate-500">
                                        {tier.label}
                                      </TableCell>
                                      <TableCell className="px-0 py-1 text-right text-sm text-slate-500">
                                        {tier.rate}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
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
