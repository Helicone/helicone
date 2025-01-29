import { CheckIcon } from "@heroicons/react/24/solid";

export type Feature = {
  title: string;
  description: string[];
  imageSrc: string;
  imageAlt: string;
  isImageLeft?: boolean;
};

export type FeaturePreviewSectionProps = {
  pageTitle: string;
  features: Feature[];
  ctaImage?: string;
  showCTA?: boolean;
};

const FeaturePreviewSection = ({
  pageTitle,
  features,
  ctaImage,
  showCTA = true,
}: FeaturePreviewSectionProps) => {
  return (
    <div className="-mt-56 relative bg-[#ecf6fc] rounded-[35.22px] shadow-[14.889px_4.581px_19.088px_0px_rgba(0,0,0,0.10)] border border-white p-[18px]">
      <div className="bg-white rounded-3xl relative">
        {/* Reduced padding-top from pt-20 to pt-10 */}
        <div className="w-[668px] mx-auto pt-10 mb-20">
          <h2 className="text-center text-[#031727] text-4xl font-semibold font-['Inter'] leading-[48px] tracking-tight">
            {pageTitle}
          </h2>
        </div>

        {/* Features List */}
        <div className="w-[1092px] flex-col justify-start items-start gap-10 inline-flex mx-auto px-0">
          {features.map((feature, index) => (
            <div
              key={index}
              className="self-stretch justify-start items-center gap-20 inline-flex"
            >
              {feature.isImageLeft ? (
                <>
                  <img
                    className="w-[563px] h-[311px] rounded-[18px] border border-slate-200"
                    src={feature.imageSrc}
                    alt={feature.imageAlt}
                  />
                  <FeatureText
                    title={feature.title}
                    description={feature.description}
                  />
                </>
              ) : (
                <>
                  <FeatureText
                    title={feature.title}
                    description={feature.description}
                  />
                  <img
                    className="w-[563px] h-[311px] rounded-[18px] border border-slate-200"
                    src={feature.imageSrc}
                    alt={feature.imageAlt}
                  />
                </>
              )}
            </div>
          ))}

          {/* Bottom CTA Section */}
          {showCTA && (
            <div className="self-stretch h-[354px] px-9 py-6 bg-[#f2f9fc] rounded-2xl border border-[#a2c1dd] flex-col justify-start items-center gap-2.5 flex">
              {ctaImage && (
                <img
                  className="w-[858px] h-[244px]"
                  src={ctaImage}
                  alt="Feature overview"
                />
              )}
              <button className="w-[210px] h-[52px] px-6 py-1.5 bg-[#0da5e8] rounded-xl justify-center items-center gap-2.5 inline-flex">
                <div className="text-white text-base font-bold font-['Inter'] leading-normal tracking-tight">
                  Start 7-day free trial
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FeatureText = ({
  title,
  description,
}: {
  title: string;
  description: string[];
}) => (
  <div className="w-[449px] flex-col justify-start items-start gap-3 inline-flex">
    <div className="text-slate-900 text-3xl font-semibold font-['Inter'] whitespace-pre-line">
      {title}
    </div>
    <div className="self-stretch flex-col justify-start items-start flex">
      {description.map((text, index) => (
        <div
          key={index}
          className="self-stretch p-2 bg-white justify-start items-start gap-2 inline-flex"
        >
          <div className="h-[24.53px] py-1 justify-start items-center gap-2.5 flex">
            <CheckIcon className="h-[16.53px] text-green-500" />
          </div>
          <div className="grow shrink basis-0 text-slate-700 text-base font-medium font-['Inter'] leading-normal">
            {text}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default FeaturePreviewSection;
