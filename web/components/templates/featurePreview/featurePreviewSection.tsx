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
  return <>hi</>;
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
