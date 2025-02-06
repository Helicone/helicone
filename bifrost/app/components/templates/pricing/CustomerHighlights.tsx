import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CustomerHighlight {
  metric: string;
  description: string;
  logoSrc: string;
  logoAlt: string;
  tier: {
    name: string;
    ctaText: string;
    ctaHref: string;
    isPrimary?: boolean;
  };
}

const highlights: CustomerHighlight[] = [
  {
    metric: "386 hours",
    description: "saved by using cached responses",
    logoSrc: "/static/other-logos/sunrun.webp",
    logoAlt: "sunrun",
    tier: {
      name: "Free",
      ctaText: "Get started",
      ctaHref: "https://us.helicone.ai/signup",
    },
  },
  {
    metric: "2 days",
    description: "saved on combing through requests",
    logoSrc: "/static/qawolf.webp",
    logoAlt: "qawolf",
    tier: {
      name: "Pro",
      ctaText: "7-day free trial",
      ctaHref: "https://us.helicone.ai/settings/billing",
      isPrimary: true,
    },
  },
  {
    metric: "Critical bug detected,",
    description: "saved agent runtime by 30%",
    logoSrc: "/static/filevine.webp",
    logoAlt: "filevine",
    tier: {
      name: "Enterprise",
      ctaText: "Contact sales",
      ctaHref: "/contact",
    },
  },
];

export default function CustomerHighlights() {
  return (
    <div className="min-h-[276px] flex items-center justify-center py-4">
      <div className="w-full rounded-xl flex flex-col md:flex-row border border-slate-200">
        {highlights.map((highlight, index) => (
          <div
            key={index}
            className={`flex-1 flex flex-col justify-between items-start
              ${
                index !== highlights.length - 1
                  ? "border-b md:border-b-0 md:border-r border-slate-200"
                  : ""
              }
            `}
          >
            <div className="px-6 py-9">
              <div className="self-stretch">
                <span className="text-xl text-slate-700 font-bold">
                  {highlight.metric}
                </span>
                <span className="text-xl text-slate-700">
                  {" " + highlight.description}
                </span>
              </div>
              <div className="mt-6 h-[43px] w-[175px]">
                <Image
                  src={highlight.logoSrc}
                  alt={highlight.logoAlt}
                  width={1000}
                  height={50}
                />
              </div>
            </div>
            <div className="w-full border-t border-slate-200">
              <div className="px-6 py-4 flex justify-between items-center">
                <span className="text-slate-900 font-medium">
                  {highlight.tier.name}
                </span>
                <Button
                  variant={highlight.tier.isPrimary ? "default" : "secondary"}
                  className={
                    highlight.tier.isPrimary ? "bg-brand text-white" : ""
                  }
                  asChild
                >
                  <Link href={highlight.tier.ctaHref}>
                    {highlight.tier.ctaText}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
