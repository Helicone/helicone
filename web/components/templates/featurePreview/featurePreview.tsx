import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import LogoBox from "./LogoBox";
import FeaturePreviewSection from "./featurePreviewSection";

interface FeaturePreviewProps {
  title: string;
  subtitle: string;
  pricingPlans: PricingPlan[];
  proRequiredText?: string;
  pageTitle: string;
  features: any[];
  ctaImage: string;
}

type PricingFeature = {
  name: string;
  included: boolean;
  additionalCost?: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  isSelected?: boolean;
  features: PricingFeature[];
};

const FeaturePreview = ({
  title,
  subtitle,
  pricingPlans,
  proRequiredText,
  pageTitle,
  features,
  ctaImage,
}: FeaturePreviewProps) => {
  const [selectedPlan, setSelectedPlan] = useState(pricingPlans[0].name);

  return (
    <div className="relative">
      <div className="absolute inset-0 max-w-7xl mx-auto z-[30] pointer-events-none">
        <LogoBox
          imgSrc="/static/pricing/anthropic.webp"
          className="w-[130px] h-[130px] 2xl:w-[190px] 2xl:h-[190px] absolute bottom-[18vh] left-20 rotate-[13deg]"
          innerClassName="bg-white p-4"
        />
        <LogoBox
          imgSrc="/static/pricing/gemini.webp"
          className="w-24 h-24 2xl:w-28 2xl:h-28 absolute top-20 left-1/4 2xl:translate-x-[-200px] translate-x-[-100px] rotate-[-15deg]"
          innerClassName="bg-white"
        />
        <LogoBox
          imgSrc="/static/pricing/logo2.webp"
          className="w-[140px] h-[140px] 2xl:w-[180px] 2xl:h-[180px] absolute top-40 right-1/3 2xl:translate-x-[50px] translate-x-[80px] rotate-[13deg]"
        />
        <LogoBox
          imgSrc="/static/pricing/chatgpt.webp"
          className="w-[140px] h-[140px] 2xl:w-[180px] 2xl:h-[180px] absolute top-16 right-1/4 2xl:translate-x-[150px] translate-x-[150px] rotate-[15deg]"
          innerClassName="bg-[#0FA37F] rounded-3xl"
        />
        <LogoBox
          imgSrc="/static/pricing/togetherai.webp"
          className="w-[120px] h-[120px] 2xl:w-[160px] 2xl:h-[160px] absolute top-12 right-0 2xl:-translate-x-[100px] -translate-x-[40px] rotate-[6deg]"
          innerClassName="rounded-3xl"
        />
        <LogoBox
          imgSrc="/static/pricing/mistral.webp"
          className="w-24 h-24 2xl:w-28 2xl:h-28 absolute bottom-1/3 right-1/4 2xl:translate-x-[100px] translate-x-[100px] -rotate-[15deg]"
          innerClassName="bg-white p-2"
        />
        <LogoBox
          imgSrc="/static/pricing/groq.svg"
          className="w-[120px] h-[120px] 2xl:w-[160px] 2xl:h-[160px] absolute top-1/2 2xl:-translate-y-[100px] -translate-y-[50px] right-0 2xl:-translate-x-[150px] -translate-x-[80px] rotate-[27deg]"
          innerClassName="bg-white p-2"
        />
        <LogoBox
          imgSrc="/static/pricing/logo3.webp"
          className="w-28 h-28 2xl:w-32 2xl:h-32 absolute bottom-0 right-1/4 2xl:translate-x-[100px] translate-x-[180px] rotate-[-32deg]"
          innerClassName="bg-white p-2"
        />
        <LogoBox
          imgSrc="/static/pricing/logo4.webp"
          className="w-20 h-20 2xl:w-24 2xl:h-24 absolute bottom-24 right-0 2xl:-translate-x-[150px] -translate-x-[60px] rotate-[-15deg]"
        />
      </div>

      <div className="relative h-screen">
        <div className="relative z-30 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
          <div className="text-center mb-8">
            <div className="text-[#031727] text-[40px] font-semibold font-['Inter'] leading-[52px] tracking-tight">
              {title} <br />
              {subtitle}
            </div>
          </div>

          <div className="h-[367px] flex-col justify-start items-start gap-6 inline-flex">
            <div className="self-stretch px-3 py-2 bg-sky-50 rounded-lg border border-sky-200 justify-center items-center gap-2.5 inline-flex">
              <div className="w-[18px] h-[18px] relative overflow-hidden"></div>
              <div>
                <span className="text-sky-500 text-base font-medium font-['Inter'] leading-normal tracking-tight">
                  Adding prompt management requires a{" "}
                </span>
                <span className="text-sky-500 text-base font-medium font-['Inter'] underline leading-normal tracking-tight">
                  Pro plan
                </span>
                <span className="text-sky-500 text-base font-medium font-['Inter'] leading-normal tracking-tight">
                  .{" "}
                </span>
              </div>
            </div>

            <div className="justify-center items-center gap-6 inline-flex">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`
                      w-[340px] h-[303px] p-6 bg-white rounded-[18px] flex-col justify-start items-start gap-4 inline-flex cursor-pointer
                      relative overflow-hidden
                      ${
                        plan.name === selectedPlan
                          ? "border-2 border-sky-500"
                          : "border border-slate-200"
                      }
                      group
                    `}
                >
                  <div
                    className="
                      absolute inset-0 
                      bg-gradient-to-t from-sky-500/20 via-sky-500/5 via-35% to-transparent to-40%
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-300
                      pointer-events-none
                    "
                  />
                  <div className="relative z-10 self-stretch h-[255px] flex-col justify-start items-start gap-6 flex">
                    <div className="self-stretch h-[87px] flex-col justify-start items-start gap-3 flex">
                      <div className="self-stretch justify-between items-center inline-flex">
                        <div className="text-slate-900 text-lg font-semibold font-['Inter'] leading-none">
                          {plan.name}
                        </div>
                        <div className="w-[27px] h-[27px] bg-white rounded-full border border-black flex items-center justify-center">
                          {plan.name === selectedPlan && (
                            <div className="w-[17px] h-[17px] bg-sky-500 rounded-full" />
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-900 text-[40px] font-medium font-['Inter']">
                          ${plan.price}
                        </span>
                        <span className="text-slate-500 text-[40px] font-normal font-['Inter']">
                          /mo
                        </span>
                      </div>
                    </div>
                    <div className="self-stretch h-36 flex-col justify-start items-start flex">
                      {plan.features.map((feature, index) => (
                        <div
                          key={feature.name}
                          className="self-stretch h-9 flex-col justify-start items-start flex"
                        >
                          <div className="self-stretch p-2 justify-start items-start gap-2 inline-flex">
                            <div className="w-[16.53px] h-[16.53px] relative overflow-hidden">
                              {feature.included ? (
                                <CheckIcon className="w-full h-full text-green-500" />
                              ) : (
                                <XMarkIcon className="w-full h-full text-red-500" />
                              )}
                            </div>
                            <div className="grow shrink basis-0 text-slate-700 text-base font-medium font-['Inter'] leading-tight">
                              {feature.name}
                              {feature.additionalCost &&
                                ` (${feature.additionalCost})`}
                            </div>
                          </div>
                          {index < plan.features.length - 1 && (
                            <div className="self-stretch h-[0px] border border-slate-200" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="h-[52px] px-6 py-1.5 bg-[#0da5e8] rounded-xl justify-center items-center gap-2.5 inline-flex cursor-pointer">
              <div className="text-white text-lg font-bold font-['Inter'] leading-normal tracking-tight">
                Start 7-day free trial
              </div>
            </div>

            <div className="h-11 p-2.5 justify-center items-center gap-2.5 inline-flex cursor-pointer">
              <div className="text-[#031727] text-lg font-semibold font-['Inter'] leading-normal tracking-tight">
                Read the doc
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeaturePreviewSection
        pageTitle={pageTitle}
        features={features}
        ctaImage={ctaImage}
      />
    </div>
  );
};

export default FeaturePreview;
