import { XMarkIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import LogoBox from "./LogoBox";
import FeaturePreviewSection, {
  FeaturePreviewSectionProps,
} from "./featurePreviewSection";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { H1, H4, P, Small } from "@/components/ui/typography";

interface FeaturePreviewProps<T extends string> {
  title: string;
  subtitle: string;
  pricingPlans: PricingPlan<T>[];
  featureSectionProps: FeaturePreviewSectionProps;
  isOnFreeTier?: boolean;
  onStartTrial?: (selectedPlan: T) => Promise<void>;
}

export type PricingPlan<T extends string = string> = {
  name: T;
  isSelected?: boolean;
  price: string;
  priceSubtext?: string;
  features: PricingFeature[];
};

type PricingFeature = {
  name: string;
  included: boolean;
  additionalCost?: string;
};

const FeaturePreview = <T extends string>({
  title,
  subtitle,
  pricingPlans,
  featureSectionProps,
  isOnFreeTier = false,
  onStartTrial,
}: FeaturePreviewProps<T>) => {
  const org = useOrg();

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
  });

  const isTrialActive =
    subscription.data?.data?.trial_end &&
    new Date(subscription.data.data.trial_end * 1000) > new Date() &&
    (!subscription.data?.data?.current_period_start ||
      new Date(subscription.data.data.trial_end * 1000) >
        new Date(subscription.data.data.current_period_start * 1000));

  const [selectedPlan, setSelectedPlan] = useState<T>(() => {
    const defaultPlan = pricingPlans.find((plan) => plan.isSelected);
    return defaultPlan?.name ?? pricingPlans[0]?.name ?? ("" as T);
  });

  return (
    <div className="min-h-screen">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-[30] mx-auto max-w-7xl">
          <LogoBox
            imgSrc="/static/pricing/anthropic.webp"
            className="absolute left-[150px] top-[500px] h-[130px] w-[130px] translate-x-[30px] rotate-[10deg] 2xl:top-[500px]"
            innerClassName="bg-white p-4"
          />
          <LogoBox
            imgSrc="/static/pricing/gemini.webp"
            className="absolute right-10 top-[200px] h-24 w-24 translate-x-[-50px] rotate-[-25deg] 2xl:top-[200px]"
            innerClassName="bg-white"
          />
          <LogoBox
            imgSrc="/static/pricing/logo2.webp"
            className="absolute left-0 top-[430px] h-[120px] w-[120px] translate-x-[30px] rotate-[8deg] 2xl:top-[430px]"
          />
          <LogoBox
            imgSrc="/static/pricing/chatgpt.webp"
            className="absolute right-1/4 top-[500px] h-[140px] w-[140px] translate-x-[150px] rotate-[15deg] 2xl:top-[500px]"
            innerClassName="bg-[#0FA37F] rounded-3xl"
            size="large"
          />
          <LogoBox
            imgSrc="/static/pricing/togetherai.webp"
            className="absolute left-14 top-[300px] h-[80px] w-[80px] translate-x-[50px] rotate-[6deg] 2xl:top-[300px]"
            innerClassName="rounded-3xl"
            size="small"
          />
          <LogoBox
            imgSrc="/static/pricing/mistral.webp"
            className="absolute left-0 top-[650px] h-24 w-24 translate-x-[30px] rotate-[-15deg] 2xl:top-[650px]"
            innerClassName="bg-white p-2"
            size="medium"
          />
          <LogoBox
            imgSrc="/static/pricing/groq.svg"
            className="absolute right-10 top-[400px] h-[110px] w-[110px] -translate-y-[50px] rotate-[12deg] 2xl:top-[400px]"
            innerClassName="bg-white p-2"
            size="medium"
          />
          <LogoBox
            imgSrc="/static/pricing/logo3.webp"
            className="absolute right-1/4 top-[700px] h-28 w-28 translate-x-[200px] rotate-[-25deg] 2xl:top-[700px]"
            innerClassName="bg-white p-2"
            size="medium"
          />
          <LogoBox
            imgSrc="/static/pricing/logo4.webp"
            className="absolute left-32 top-[700px] h-20 w-20 translate-x-[30px] rotate-[-15deg] 2xl:top-[700px]"
            size="small"
          />
        </div>

        {/* Feature Preview */}
        <div className="mx-auto mb-8 flex flex-col items-center">
          <div className="mb-8 text-center lg:mb-4">
            <H1 className="text-[40px] leading-[52px] lg:text-[32px]">
              {title} <br />
              {subtitle}
            </H1>
          </div>

          <div className="inline-flex max-h-[367px] flex-col items-start justify-start gap-6">
            {isOnFreeTier ? (
              <div className="inline-flex items-center justify-center gap-2.5 self-stretch rounded-lg border border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-3 py-2">
                <div className="relative h-[18px] w-[18px] overflow-hidden">
                  <LightBulbIcon className="h-full w-full text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <P className="text-[hsl(var(--primary))]">
                    Adding prompt management requires a{" "}
                    <span className="font-medium underline">Pro plan</span>
                    .{" "}
                  </P>
                </div>
              </div>
            ) : isTrialActive ? (
              <div className="inline-flex items-center justify-center gap-2.5 self-stretch rounded-lg border border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-3 py-2">
                <div className="relative h-[18px] w-[18px] overflow-hidden">
                  <LightBulbIcon className="h-full w-full text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <P className="text-[hsl(var(--primary))]">
                    You won&apos;t be charged during your trial period
                  </P>
                </div>
              </div>
            ) : null}

            <div className="inline-flex items-center justify-center gap-6">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`relative inline-flex h-[303px] w-[320px] cursor-pointer flex-col items-start justify-start gap-4 overflow-hidden rounded-[18px] bg-[hsl(var(--card))] p-5 lg:h-[280px] lg:w-[300px] ${
                    plan.name === selectedPlan
                      ? "border-2 border-[hsl(var(--primary))]"
                      : "border border-[hsl(var(--border))]"
                  } group transition-colors duration-300 hover:bg-[hsl(var(--primary)/0.1)]`}
                >
                  <div className="relative z-10 flex h-[255px] flex-col items-start justify-start gap-6 self-stretch lg:gap-2">
                    <div className="flex h-[87px] flex-col items-start justify-start gap-3 self-stretch">
                      <div className="inline-flex items-center justify-between self-stretch">
                        <H4>{plan.name}</H4>
                        <div
                          className={`h-[24px] w-[24px] rounded-full ${
                            plan.name === selectedPlan
                              ? "border-[7px] border-[hsl(var(--primary))]"
                              : "border border-[hsl(var(--muted-foreground))]"
                          } flex items-center justify-center bg-[hsl(var(--card))] p-0`}
                        ></div>
                      </div>
                      <div className="flex flex-row items-baseline gap-1">
                        <div>
                          <span className="text-[40px] font-medium text-[hsl(var(--foreground))]">
                            ${plan.price}
                          </span>
                          <span className="text-[40px] font-light text-[hsl(var(--muted-foreground))]">
                            /mo
                          </span>
                        </div>
                        {plan.priceSubtext && (
                          <Small className="mt-1 text-[hsl(var(--muted-foreground))]">
                            {plan.priceSubtext}
                          </Small>
                        )}
                      </div>
                    </div>
                    <div className="flex h-36 flex-col items-start justify-start self-stretch">
                      {plan.features.map((feature, index) => (
                        <div
                          key={feature.name}
                          className="flex h-9 flex-col items-start justify-start self-stretch"
                        >
                          <div className="inline-flex items-center justify-start gap-2 self-stretch p-2">
                            <div className="relative flex h-[16px] w-[16px] items-center justify-center overflow-hidden">
                              {feature.included ? (
                                <CheckIcon className="h-full w-full text-[hsl(var(--confirmative))]" />
                              ) : (
                                <XMarkIcon className="h-full w-full text-[hsl(var(--destructive))]" />
                              )}
                            </div>
                            <P className="shrink grow basis-0">
                              {feature.name} {feature.additionalCost}
                            </P>
                          </div>
                          {index < plan.features.length - 1 && (
                            <div className="h-[0px] self-stretch border-t border-[hsl(var(--border))]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex w-[220px] flex-col items-center gap-4 lg:mt-4">
            <Button
              onClick={() => onStartTrial?.(selectedPlan)}
              className="inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-[hsl(var(--primary))] px-6 py-1.5 text-lg font-medium leading-normal tracking-normal text-[hsl(var(--primary-foreground))]"
              variant="action"
            >
              {isOnFreeTier ? "Start 7-day free trial" : "Upgrade now"}
            </Button>

            <a
              href="https://docs.helicone.ai"
              target="_blank"
              className="w-full"
              rel="noreferrer"
            >
              <Button
                className="h-[52px] w-full rounded-xl border-none bg-transparent px-6 py-1.5 text-lg font-semibold leading-normal tracking-tight text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))] hover:no-underline"
                variant="action"
              >
                Read the docs
              </Button>
            </a>
          </div>
        </div>

        <FeaturePreviewSection
          {...featureSectionProps}
          onStartTrial={() => onStartTrial?.(selectedPlan) || Promise.resolve()}
        />
      </div>
    </div>
  );
};

export default FeaturePreview;
