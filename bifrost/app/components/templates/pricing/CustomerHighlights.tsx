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
    metric: "Saved 386 hours",
    description: "by using cached responses",
    logoSrc: "/static/other-logos/sunrun.webp",
    logoAlt: "sunrun",
    tier: {
      name: "Free",
      ctaText: "Get started",
      ctaHref: "https://us.helicone.ai/signup",
    },
  },
  {
    metric: "Saved 2 days",
    description: "on combing through requests",
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
    description: "saving agent runtime by 30%",
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
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="border-border flex w-full flex-col rounded-xl border md:flex-row">
        {highlights.map((highlight, index) => (
          <div
            key={index}
            className={`flex flex-1 flex-col items-start justify-between ${
              index !== highlights.length - 1
                ? "border-border border-b md:border-b-0 md:border-r"
                : ""
            } `}
          >
            <div className="flex flex-col-reverse gap-8 px-6 py-9">
              <div className="self-stretch">
                <span className="text-xl font-bold text-slate-700">
                  {highlight.metric}
                </span>
                <br />
                <span className="text-xl text-slate-700">
                  {" " + highlight.description}
                </span>
              </div>
              <div className="h-auto w-[120px]">
                <Image
                  src={highlight.logoSrc}
                  alt={highlight.logoAlt}
                  width={1000}
                  height={50}
                />
              </div>
            </div>
            <div className="border-border w-full border-t">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-primary font-medium">
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
