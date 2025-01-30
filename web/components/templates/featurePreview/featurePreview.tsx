import { XMarkIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import LogoBox from "./LogoBox";
import FeaturePreviewSection, {
  FeaturePreviewSectionProps,
} from "./featurePreviewSection";
import { Button } from "@/components/ui/button";

interface FeaturePreviewProps<T extends string> {
  title: string;
  subtitle: string;
  pricingPlans: PricingPlan<T>[];
  featureSectionProps: FeaturePreviewSectionProps;
  proRequired?: boolean;
  onStartTrial?: (selectedPlan?: T) => Promise<void>;
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
  proRequired = false,
  onStartTrial,
}: FeaturePreviewProps<T>) => {
  const [selectedPlan, setSelectedPlan] = useState<T>(() => {
    const defaultPlan = pricingPlans.find((plan) => plan.isSelected);
    return defaultPlan?.name ?? pricingPlans[0].name;
  });

  return (
    <div className="min-h-screen">
      <div className="relative">
        <div className="absolute inset-0 max-w-7xl mx-auto z-[30] pointer-events-none">
          <LogoBox
            imgSrc="/static/pricing/anthropic.webp"
            className="w-[130px] h-[130px] absolute 
            top-[500px] 2xl:top-[500px] left-[150px] translate-x-[30px] rotate-[10deg]"
            innerClassName="bg-white p-4"
          />
          <LogoBox
            imgSrc="/static/pricing/gemini.webp"
            className="w-24 h-24 absolute 
            top-[200px] 2xl:top-[200px] right-10 translate-x-[-50px] rotate-[-25deg]"
            innerClassName="bg-white"
          />
          <LogoBox
            imgSrc="/static/pricing/logo2.webp"
            className="w-[120px] h-[120px] absolute 
            top-[430px] 2xl:top-[430px] left-0 translate-x-[30px] rotate-[8deg]"
          />
          <LogoBox
            imgSrc="/static/pricing/chatgpt.webp"
            className="w-[140px] h-[140px] absolute
            top-[500px] 2xl:top-[500px] right-1/4 translate-x-[150px] rotate-[15deg]"
            innerClassName="bg-[#0FA37F] rounded-3xl"
            size="large"
          />
          <LogoBox
            imgSrc="/static/pricing/togetherai.webp"
            className="w-[80px] h-[80px] absolute 
            top-[300px] 2xl:top-[300px] left-14 translate-x-[50px] rotate-[6deg]"
            innerClassName="rounded-3xl"
            size="small"
          />
          <LogoBox
            imgSrc="/static/pricing/mistral.webp"
            className="w-24 h-24 absolute 
            top-[650px] 2xl:top-[650px] left-0 translate-x-[30px] rotate-[-15deg]"
            innerClassName="bg-white p-2"
            size="medium"
          />
          <LogoBox
            imgSrc="/static/pricing/groq.svg"
            className="w-[110px] h-[110px] absolute 
            top-[400px] 2xl:top-[400px] right-10 -translate-y-[50px] rotate-[12deg]"
            innerClassName="bg-white p-2"
            size="medium"
          />
          <LogoBox
            imgSrc="/static/pricing/logo3.webp"
            className="w-28 h-28 absolute 
            top-[700px] 2xl:top-[700px] right-1/4 translate-x-[200px] rotate-[-25deg]"
            innerClassName="bg-white p-2"
            size="medium"
          />
          <LogoBox
            imgSrc="/static/pricing/logo4.webp"
            className="w-20 h-20 absolute 
            top-[700px] 2xl:top-[700px] left-32 translate-x-[30px] rotate-[-15deg]"
            size="small"
          />
        </div>

        {/* Feature Preview */}
        <div className="flex flex-col items-center mx-auto mb-8">
          <div className="text-center mb-8 lg:mb-4">
            <div className="text-[#031727] text-[40px] lg:text-[32px] font-semibold leading-[52px] tracking-normal">
              {title} <br />
              {subtitle}
            </div>
          </div>

          <div className="max-h-[367px] flex-col justify-start items-start inline-flex gap-6">
            {proRequired && (
              <div className="self-stretch px-3 py-2 bg-sky-50 rounded-lg border border-sky-200 justify-center items-center gap-2.5 inline-flex">
                <div className="w-[18px] h-[18px] relative overflow-hidden">
                  <LightBulbIcon className="w-full h-full text-sky-500" />
                </div>
                <div>
                  <span className="text-sky-500 text-base font-normal leading-normal tracking-tight">
                    Adding prompt management requires a{" "}
                  </span>
                  <span className="text-sky-500 text-base font-medium underline leading-normal tracking-tight">
                    Pro plan
                  </span>
                  <span className="text-sky-500 text-base font-medium leading-normal tracking-tight">
                    .{" "}
                  </span>
                </div>
              </div>
            )}

            <div className="justify-center items-center gap-6 inline-flex">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`
                    w-[320px] h-[303px] lg:w-[300px] lg:h-[280px] p-5 rounded-[18px] flex-col justify-start items-start gap-4 inline-flex cursor-pointer
                    relative overflow-hidden bg-white
                    ${
                      plan.name === selectedPlan
                        ? "border-2 border-sky-500"
                        : "border border-slate-200"
                    }
                    group hover:bg-sky-100 transition-colors duration-300
                  `}
                >
                  <div className="relative z-10 self-stretch h-[255px] flex-col justify-start items-start gap-6 lg:gap-2 flex">
                    <div className="self-stretch h-[87px] flex-col justify-start items-start gap-3 flex">
                      <div className="self-stretch justify-between items-center inline-flex">
                        <div className="text-slate-900 text-lg font-medium leading-none">
                          {plan.name}
                        </div>
                        <div
                          className={`w-[24px] h-[24px] rounded-full ${
                            plan.name === selectedPlan
                              ? "border-[7px] border-sky-500"
                              : "border border-slate-500"
                          } bg-white flex items-center justify-center p-0`}
                        ></div>
                      </div>
                      <div className="flex flex-row items-baseline gap-1">
                        <div>
                          <span className="text-slate-900 text-[40px] font-medium">
                            ${plan.price}
                          </span>
                          <span className="text-slate-500 text-[40px] font-light">
                            /mo
                          </span>
                        </div>
                        {plan.priceSubtext && (
                          <div className="text-slate-500 text-sm mt-1">
                            {plan.priceSubtext}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="self-stretch h-36 flex-col justify-start items-start flex">
                      {plan.features.map((feature, index) => (
                        <div
                          key={feature.name}
                          className="self-stretch h-9 flex-col justify-start items-start flex"
                        >
                          <div className="self-stretch p-2 justify-start items-center inline-flex gap-2">
                            <div className="w-[16px] h-[16px] relative overflow-hidden flex items-center justify-center">
                              {feature.included ? (
                                <CheckIcon className="w-full h-full text-green-500" />
                              ) : (
                                <XMarkIcon className="w-full h-full text-red-500" />
                              )}
                            </div>
                            <div className="grow shrink basis-0 text-slate-700 text-base font-[16px] leading-tight">
                              {feature.name}
                              {feature.additionalCost &&
                                ` (${feature.additionalCost})`}
                            </div>
                          </div>
                          {index < plan.features.length - 1 && (
                            <div className="self-stretch h-[0px] border-t border-slate-200" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 mt-8 w-[220px] lg:mt-4">
            <Button
              onClick={() => onStartTrial?.(selectedPlan)}
              className="w-full text-white text-lg font-medium leading-normal tracking-normal h-[52px] px-6 py-1.5 bg-[#0da5e8] rounded-xl justify-center items-center gap-2.5 inline-flex"
              variant="action"
            >
              Start 7-day free trial
            </Button>

            <a
              href="https://docs.helicone.ai"
              target="_blank"
              className="w-full"
            >
              <Button
                className="w-full bg-transparent border-none rounded-xl hover:bg-slate-200 text-slate-700 text-lg font-semibold leading-normal tracking-tight hover:no-underline h-[52px] px-6 py-1.5"
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
