import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  ExternalLink,
  Waypoints,
  Loader,
} from "lucide-react";
import Link from "next/link";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useRouter } from "next/navigation";
import { H1, H4, Muted } from "@/components/ui/typography";

export default function IntegratePage() {
  const org = useOrg();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { updateCurrentStep } = useOrgOnboarding(org?.currentOrg?.id ?? "");

  useEffect(() => {
    if (org?.currentOrg?.id) {
      updateCurrentStep("INTEGRATION");
    }
  }, [org?.currentOrg?.id]);

  const handleDoItLater = () => {
    setIsRedirecting(true);
    router.push("/dashboard");
  };

  return (
    <OnboardingHeader>
      <div className="mx-auto flex max-w-4xl flex-col gap-6 py-12">
        <div className="flex flex-col gap-2">
          <H1>Get integrated</H1>
          <Muted>Choose your preferred integration method.</Muted>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Async Card */}
          <Link href="/onboarding/integrate/async" className="flex-1">
            <Card className="h-full transition-colors hover:bg-[hsl(var(--muted))]">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] md:h-12 md:w-12">
                    <ArrowLeftRight
                      size={20}
                      className="text-[hsl(var(--foreground))]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <H4>Async</H4>
                    <Muted>Flexible, not on the critical path.</Muted>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex"
                  >
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
              <div className="border-t border-[hsl(var(--border))] p-4">
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                  <li>No latency impact</li>
                  <li>Does not support all languages and frameworks.</li>
                  <li>Requires SDK</li>
                </ul>
              </div>
            </Card>
          </Link>

          {/* Proxy Card */}
          <Link href="/onboarding/integrate/proxy" className="flex-1">
            <Card className="h-full transition-colors hover:bg-[hsl(var(--muted))]">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] md:h-12 md:w-12">
                    <Waypoints
                      size={20}
                      className="text-[hsl(var(--foreground))]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <H4>Proxy</H4>
                    <Muted>Simplest and fastest integration.</Muted>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex"
                  >
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
              <div className="border-t border-[hsl(var(--border))] p-4">
                <div className="flex flex-col gap-2.5">
                  <ul className="ml-4 list-inside list-disc text-sm text-[hsl(var(--muted-foreground))]">
                    <li>~50ms latency impact</li>
                    <li>Supports 300+ LLMs</li>
                    <li>Built-in caching, rate limiting and more.</li>
                  </ul>
                  <Badge variant="helicone-sky" className="w-fit">
                    Recommended
                  </Badge>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="https://docs.helicone.ai/references/proxy-vs-async"
            target="_blank"
          >
            <Button
              variant="link"
              className="h-auto w-fit p-0 text-[hsl(var(--primary))]"
            >
              Read more about the difference
              <ExternalLink size={16} className="ml-2" />
            </Button>
          </Link>
          <Button
            variant="secondary"
            className="w-fit"
            onClick={handleDoItLater}
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Do it later"
            )}
          </Button>
        </div>
      </div>
    </OnboardingHeader>
  );
}
