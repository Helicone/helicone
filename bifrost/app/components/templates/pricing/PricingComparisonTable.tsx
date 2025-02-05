import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clsx } from "@/utils/clsx";
import {
  CheckIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface FeatureRowProps {
  title: string;
  description: string;
  isAvailable: boolean;
  fullAccess?: boolean;
  amount?: string;
  unit?: string;
  additionalInfo?: string;
}

const FeatureRow: React.FC<FeatureRowProps> = ({
  title,
  description,
  isAvailable,
  fullAccess = false,
  amount,
  unit,
  additionalInfo,
}) => (
  <>
    <Col
      className={clsx("p-[24px] gap-[12px]", isAvailable ? "" : "bg-[#F9F9F9]")}
    >
      <Col className="gap-[4px]">
        <Row className="text-xl gap-[12px] items-center">
          <b>{title}</b>

          {fullAccess &&
            (isAvailable ? (
              <>
                <LockOpenIcon className="w-5 h-5" />
                <div
                  className={clsx(
                    "px-[12px] py-[4px] rounded-[3px] text-[14px] font-medium",
                    "bg-[#E7F6FD] text-brand"
                  )}
                >
                  full access
                </div>
              </>
            ) : (
              <>
                <LockClosedIcon className="w-5 h-5" />
                <div
                  className={clsx(
                    "px-[12px] py-[4px] rounded-[3px] text-[14px] font-medium",
                    "bg-[#F1F5F9] text-gray-600  "
                  )}
                >
                  available for <b>Team</b>
                </div>
              </>
            ))}
        </Row>
        <p className="text-slate-500">{description}</p>
      </Col>
      <Row className="items-center gap-[4px] text-brand">
        <div>How we calculate this</div>
        <ChevronDownIcon className="w-5 h-5" />
      </Row>
    </Col>
    <div
      className={clsx(
        "p-[24px] max-w-[360px] items-end text-end justify-center flex flex-col gap-[12px]",
        isAvailable ? "bg-white" : "bg-[#F9F9F9]"
      )}
    >
      {isAvailable ? (
        <CheckIcon className="w-6 h-6 text-[#6AA84F]" />
      ) : (
        <XMarkIcon className="w-6 h-6 text-red-500" />
      )}
      {amount && (
        <div className="flex flex-col gap-[4px] text-slate-500">
          <h3 className="text-[14px]">
            <b className="text-[18px] text-black font-bold">{amount}</b> {unit}
          </h3>
          {additionalInfo && (
            <p className="font-light">
              then starting at <br />
              {additionalInfo}
            </p>
          )}
        </div>
      )}
    </div>
  </>
);

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
}

interface FeatureGroup {
  title: string;
  features: Feature[];
}

const tiers: PricingTier[] = [
  {
    name: "Hobby",
    ctaText: "Get started",
    ctaHref: "#",
  },
  {
    name: "Pro",
    ctaText: "Try for free",
    ctaHref: "#",
    isPrimary: true,
  },
  {
    name: "Team",
    ctaText: "Try for free",
    ctaHref: "#",
  },
  {
    name: "Enterprise",
    ctaText: "Contact sales",
    ctaHref: "#",
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
    title: "Gateway",
    features: [
      {
        name: "Unified proxy",
        hobby: true,
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
      {
        name: "LLM security",
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
      {
        name: "Ingestion",
        hobby: "###",
        pro: "###",
        team: "###",
        enterprise: "###",
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
        name: "HIPPA",
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
        name: "Customized contracts",
        hobby: false,
        pro: false,
        team: false,
        enterprise: true,
      },
    ],
  },
];

export default function PricingComparisonTable() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-black text-4xl font-bold">Compare plans</h2>
      <div className="rounded-xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-none">
              <TableHead className="w-[318px] p-6 bg-white rounded-tl-xl">
                <div className="text-slate-900 text-lg font-semibold">
                  {/* Empty header cell */}
                </div>
              </TableHead>
              {tiers.map((tier, index) => (
                <TableHead
                  key={tier.name}
                  className={`p-3 ${tier.isPrimary ? "bg-sky-50" : "bg-white"} 
                    ${index === tiers.length - 1 ? "rounded-tr-xl" : ""}`}
                >
                  <div className="flex flex-col gap-4">
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
                <TableRow key={feature.name} className="hover:bg-white">
                  <TableCell
                    className={`w-[318px] px-6 py-3 ${
                      featureIndex === group.features.length - 1
                        ? "border-b"
                        : ""
                    }`}
                  >
                    <div className="text-slate-500 text-sm font-medium">
                      {feature.name}
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
              ))}
            </TableBody>
          ))}
        </Table>
      </div>
    </div>
  );
}
