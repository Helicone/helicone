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
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from "lucide-react";

interface FeatureUpgradeCardProps {
  title: string;
  description: string;
  infoBoxText: string;
  videoSrc?: string;
  youtubeVideo?: string;
  documentationLink: string;
}

export const FeatureUpgradeCard: React.FC<FeatureUpgradeCardProps> = ({
  title,
  description,
  infoBoxText,
  videoSrc,
  youtubeVideo,
  documentationLink,
}) => {
  const [isPlanComparisonVisible, setIsPlanComparisonVisible] = useState(false);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <p className="text-sm text-muted-foreground text-slate-400">
          {description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoBox>
          <p className="text-sm font-medium">{infoBoxText}</p>
        </InfoBox>
        {videoSrc && (
          <div className="flex justify-center items-center h-[500px]">
            <video width="100%" className="h-[500px]" autoPlay muted loop>
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {youtubeVideo && (
          <iframe
            width="100%"
            height="420"
            src={youtubeVideo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        )}
      </CardContent>
      <CardFooter className="flex flex-col justify-between w-full">
        <Button
          variant="link"
          className="px-0 w-full text-left flex justify-start"
          onClick={() => setIsPlanComparisonVisible(!isPlanComparisonVisible)}
        >
          Compare my plan with Pro{" "}
          {isPlanComparisonVisible ? (
            <ChevronUpIcon className="ml-1 h-4 w-4" />
          ) : (
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          )}
        </Button>
        {isPlanComparisonVisible && (
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-4">Plan Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Free</h3>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Current plan
                </span>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                    10k free requests/month
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                    Access to Dashboard
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                    Free, truly
                  </li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Pro</h3>
                <span className="text-sm">$20/user</span>
                <p className="text-sm mt-2">Everything in Free, plus:</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                    Limitless requests (first 100k free)
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                    Access to all features
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                    Standard support
                  </li>
                </ul>
                <a href="#" className="text-sm text-blue-600 mt-2 block">
                  See all features →
                </a>
              </div>
            </div>
          </div>
        )}
        <div className="flex mt-4 flex-row w-full gap-4">
          <Button variant="outline" asChild className="w-1/2">
            <Link href={documentationLink}>View documentation</Link>
          </Button>
          <Button asChild className="w-1/2">
            <Link href="/settings/billing">Start 14-day free trial</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
