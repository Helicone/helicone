import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { CheckIcon, CircleHelpIcon } from "lucide-react";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { FeatureName } from "@/hooks/useProFeature";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "./PricingCard";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";
type LayoutType = "featureShowcase" | "proFeatures";

interface PricingTier {
  name: string;
  price: string;
  priceDetail?: string;
  badge?: string;
  badgeColor?: "default" | "popular" | "best-value";
  isCurrentPlan?: boolean;
  features: string[];
  variant: "default" | "pro" | "team" | "hobby";
}

interface FeatureUpgradeCardProps {
  title: string;
  description: string;
  infoBoxText: string;
  videoSrc?: string;
  youtubeVideo?: string;
  documentationLink: string;
  tier?: string;
  featureName?: FeatureName;
  layoutType: LayoutType;
  pricingTiers?: PricingTier[];
  featureImage?: string;
  integrationImage?: string;
  proFeatures?: string[];
  headerTagline?: string;
  documentationText?: string;
}

export const FeatureUpgradeCard: React.FC<FeatureUpgradeCardProps> = ({
  title,
  description,
  infoBoxText,
  videoSrc,
  youtubeVideo,
  documentationLink,
  tier = "free",
  featureName,
  layoutType = "featureShowcase",
  pricingTiers = ["hobby", "pro", "team"],
  featureImage,
  integrationImage,
  proFeatures,
  headerTagline,
  documentationText = "View documentation",
}) => {
  const [isPlanComparisonVisible, setIsPlanComparisonVisible] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  const tiers = [
    {
      name: "Hobby",
      price: "Free",
      isCurrentPlan: true,
      features: ["Basic analytics", "3 team members", "1,000 requests/month"],
      variant: "none",
      badge: "Current plan",
    },
    {
      name: "Pro",
      price: "$20",
      priceDetail: "/seat/mo",
      features: [
        "Advanced analytics",
        "Unlimited team members",
        "10,000 requests/month",
        "Priority support",
      ],
      variant: "default",
    },
    {
      name: "Team",
      price: "$200",
      priceDetail: "/mo",
      features: [
        "Enterprise-grade security",
        "Custom SLAs",
        "100,000 requests/month",
        "24/7 support",
      ],
      variant: "outline",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-24 py-10 bg-white flex flex-col gap-16">
      {/* Header Section */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-row justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 flex items-center justify-center">
              <CircleHelpIcon className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-center text-slate-500 text-md font-medium leading-normal">
              {title}
            </div>
          </div>
          <div className="flex flex-row">
            <div className="h-full justify-center items-center gap-2.5 inline-flex">
              <div className="opacity-70 text-slate-500 text-lg font-normal leading-normal">
                Unlock with
              </div>
              <div className="justify-start items-center gap-2 flex">
                <Badge
                  className="bg-slate-100 text-slate-500 text-sm"
                  variant="helicone"
                >
                  Pro
                </Badge>
                <Badge
                  className="bg-slate-100 text-slate-500 text-sm"
                  variant="helicone"
                >
                  Team
                </Badge>
                <Badge
                  className="bg-slate-100 text-slate-500 text-sm"
                  variant="helicone"
                >
                  Enterprise
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-black text-3xl font-semibold leading-normal">
          {headerTagline}
        </div>

        <div className="w-full flex flex-row gap-6">
          <PricingCard title="Hobby" price="Free" isCurrentPlan={true} />
          <PricingCard
            title="Pro"
            price="$20"
            priceSubtext="/seat/mo"
            isPopular={true}
            variant="highlighted"
          />
          <PricingCard
            title="Team"
            price="$200"
            priceSubtext="/mo"
            isBestValue={true}
            variant="outlined"
          />
        </div>
      </div>

      <div className="relative">
        <img
          src={featureImage}
          alt="Feature preview"
          className="w-full h-auto rounded-2xl border border-slate-200"
        />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </div>

      <div className="w-full h-full items-center flex 2xl:flex-row flex-col gap-2 justify-between">
        <div className="w-full h-[361px] relative rounded-2xl">
          <div className="w-[450px] h-[314px] top-[29px] absolute bg-slate-100 rounded-2xl border border-slate-200">
            <div className="left-[25px] top-[20px] absolute justify-end items-center gap-[12px] inline-flex">
              <Badge className="bg-sky-200 text-sky-700 px-3 text-sm font-medium rounded-lg">
                LLM
              </Badge>
              <Badge className="bg-slate-200 text-slate-700 px-3 text-sm font-medium rounded-lg">
                Tool
              </Badge>
              <Badge className="bg-slate-200 text-slate-700 px-3 text-sm font-medium rounded-lg">
                Threat
              </Badge>
              <Badge className="bg-orange-200 text-orange-700 px-3 text-sm font-medium rounded-lg">
                Vector DB
              </Badge>
              <Badge className="bg-orange-200 text-orange-700 px-3 text-sm font-medium rounded-lg">
                Image
              </Badge>
            </div>
            <div className="left-[160px] top-[65px] absolute justify-end items-center gap-[12px] inline-flex">
              <Badge className="bg-orange-200 text-orange-700 px-3 text-sm font-medium rounded-lg">
                Assistant
              </Badge>
              <Badge className="bg-orange-200 text-orange-700 px-3 text-sm font-medium rounded-lg">
                Moderation
              </Badge>
              <Badge className="bg-orange-200 text-orange-700 px-3 text-sm font-medium rounded-lg">
                Embedding
              </Badge>
            </div>
          </div>
          <div className="w-[500px] h-[154px] left-[60px] top-[155px] absolute">
            <div className="w-[450px] overflow-hidden border-8 border-slate-200 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.1)] [&_pre]:!rounded-none">
              <DiffHighlight
                code={`"Helicone-Session-Id": randomUUID(),
"Helicone-Session-Path": "/user-db-query",
"Helicone-Session-Name": "User DB Query",`}
                language="javascript"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
                maxHeight={false}
                textSize="md"
                marginTop={false}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex-col flex gap-8 max-w-xl">
          <div className="h-full flex-col justify-start items-start gap-1 flex">
            <h3 className="text-slate-900 text-3xl font-semibold leading-normal">
              Start tracking with headers
            </h3>
            <p className="w-full text-slate-500 text-md font-normal leading-relaxed">
              Track your sessions and traces with 3 simple headers.
            </p>
          </div>

          <div className="flex flex-row gap-16">
            <div className="flex-col w-full gap-4 flex">
              <div className="w-full flex-col gap-1 flex">
                <h4 className="text-slate-900 text-lg font-medium leading-normal">
                  Define hierarchy
                </h4>
                <p className="text-slate-500 text-base font-normal leading-relaxed">
                  A simple path syntax to define parent-child relationship.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 w-fit text-slate-500"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.83334 14.1667L14.1667 5.83334M14.1667 5.83334H7.50001M14.1667 5.83334V12.5"
                    stroke="currentColor"
                    strokeWidth="1.67"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                View docs
              </Button>
            </div>

            <div className="flex-col w-full gap-4 flex">
              <div className="w-full flex-col gap-1 flex">
                <h4 className="w-full text-slate-900 text-lg font-medium leading-normal">
                  Log everything
                </h4>
                <p className="w-full text-slate-500 text-base font-normal leading-relaxed">
                  Log any LLM, vector database and tool calls.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 w-fit text-slate-500"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.83334 14.1667L14.1667 5.83334M14.1667 5.83334H7.50001M14.1667 5.83334V12.5"
                    stroke="currentColor"
                    strokeWidth="1.67"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                View docs
              </Button>
            </div>
          </div>
        </div>
      </div>

      <UpgradeProDialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        featureName={featureName}
      />
    </div>
  );
};
