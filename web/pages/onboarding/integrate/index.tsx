import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useEffect } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  ExternalLink,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { useOrg } from "@/components/layout/org/organizationContext";

export default function IntegratePage() {
  const org = useOrg();
  const { updateCurrentStep } = useOrgOnboarding(org?.currentOrg?.id ?? "");

  useEffect(() => {
    if (org?.currentOrg?.id) {
      updateCurrentStep("INTEGRATION");
    }
  }, [org?.currentOrg?.id]);

  return (
    <OnboardingHeader>
      <div className="flex flex-col gap-6 mx-auto max-w-4xl mt-6 md:mt-12 px-4 md:px-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl md:text-2xl font-semibold">Get integrated</h1>
          <p className="text-sm text-slate-500">
            Choose your preferred integration method.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Async Card */}
          <Link href="/onboarding/integrate/async" className="flex-1">
            <Card className="h-full transition-colors hover:bg-slate-50">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center bg-slate-100 rounded-md border border-slate-200">
                    <ArrowLeftRight className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <h3 className="font-semibold">Async</h3>
                    <p className="text-sm text-slate-500">
                      Flexible, not on the critical path.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="border-t p-4">
                <ul className="text-sm space-y-1 text-slate-500 ml-4 list-disc list-inside">
                  <li>No latency impact</li>
                  <li>Does not support all languages and frameworks.</li>
                  <li>Requires SDK</li>
                </ul>
              </div>
            </Card>
          </Link>

          {/* Proxy Card */}
          <Link href="/onboarding/integrate/proxy" className="flex-1">
            <Card className="h-full transition-colors hover:bg-slate-50">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center bg-slate-100 rounded-md border border-slate-200">
                    <Waypoints className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <h3 className="font-semibold">Proxy</h3>
                    <p className="text-sm text-slate-500">
                      Simplest and fastest integration.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="border-t p-4">
                <div className="flex flex-col gap-2.5">
                  <ul className="text-sm text-slate-500 ml-4 list-disc list-inside">
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

        <div className="flex flex-col gap-4 md:gap-6">
          <Link
            href="https://docs.helicone.ai/references/proxy-vs-async"
            target="_blank"
          >
            <Button variant="link" className="h-auto w-fit p-0 text-sky-500">
              Read more about the difference
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" className="w-fit">
              Do it later
            </Button>
          </Link>
        </div>
      </div>
    </OnboardingHeader>
  );
}
